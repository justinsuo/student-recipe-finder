// AI meal logging via Anthropic Haiku vision.
// Sends a food photo to the model and gets back a list of identified
// foods with estimated macros per item.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? "";

export function isAiLoggingEnabled(): boolean {
  return API_KEY.length > 0;
}

export interface AiIdentifiedFood {
  name: string;
  servingDescription: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  confidence: "high" | "medium" | "low";
}

const SYSTEM = `You are a nutrition expert and food identification assistant. The user sends you a photo of food or a meal. Your task is to identify each distinct food item visible and estimate its macronutrients per typical serving.

Return ONLY a JSON array — no other text. Each element:
{
  "name": "descriptive food name",
  "servingDescription": "e.g. 1 cup, 1 medium piece, 100g",
  "kcal": <number>,
  "proteinG": <number>,
  "carbG": <number>,
  "fatG": <number>,
  "confidence": "high" | "medium" | "low"
}

Rules:
- Estimate for the visible serving size, not a standard 100g
- Use realistic values based on USDA data where possible
- If you cannot identify a food, omit it rather than guessing wildly
- confidence: "high" = clearly identifiable common food, "medium" = likely but uncertain, "low" = best guess
- Return an empty array [] if no food is identifiable
- Do NOT include commentary, markdown, or any text outside the JSON array`;

export async function identifyFoodFromPhoto(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<AiIdentifiedFood[]> {
  if (!API_KEY) throw new Error("AI logging is not configured");

  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "Please identify the food(s) in this image and return the JSON array of nutrition estimates.",
          },
        ],
      },
    ],
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`AI request failed: ${err}`);
  }

  const json = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = json.content.find((c) => c.type === "text")?.text ?? "[]";

  // Strip markdown code fences if the model wraps the JSON
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AiIdentifiedFood =>
        typeof item === "object" &&
        typeof item.name === "string" &&
        typeof item.kcal === "number",
    );
  } catch {
    return [];
  }
}
