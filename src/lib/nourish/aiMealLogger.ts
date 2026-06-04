// AI meal logging via Anthropic Haiku vision.
// Strategy: AI identifies components + gram estimates → USDA grounds the macros.
// Never let the model emit nutrition numbers directly — it hallucinates.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? "";

export function isAiLoggingEnabled(): boolean {
  return API_KEY.length > 0;
}

// ─── Component shape (AI output — NO macro numbers) ───────────────────────────

export interface AiMealComponent {
  /** Descriptive name suitable for USDA search e.g. "grilled chicken breast" */
  name: string;
  /** Best estimate in grams. Required — forces the model to be explicit. */
  estimatedGrams: number;
  /** One sentence stating the basis: "appears to be ~1 large breast (~150g)" */
  estimationBasis: string;
  confidence: "high" | "medium" | "low";
  /** Likely hidden extras the model noticed or suspects */
  hiddenCalories?: string;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const VISION_SYSTEM = `You are a food identification assistant helping someone log a meal.
Your job is ONLY to identify what foods are present and estimate their weights in grams.
Do NOT estimate calories or macros — that comes from a nutrition database later.

Return ONLY a JSON object — no markdown, no commentary:
{
  "components": [
    {
      "name": "specific food name suitable for database search",
      "estimatedGrams": <number — your best gram estimate for the visible portion>,
      "estimationBasis": "one sentence: what visual cue you used for the gram estimate",
      "confidence": "high" | "medium" | "low",
      "hiddenCalories": "optional — note if you suspect hidden oil/butter/sauce not visible"
    }
  ],
  "overallConfidence": "high" | "medium" | "low",
  "uncertainties": ["any aspects you're unsure about"]
}

Rules:
- Be specific with names: "white rice (cooked)" not just "rice"; "caesar salad dressing" not "dressing"
- Estimate grams for the VISIBLE PORTION, not a standard serving
- Use visual cues: plate diameter, utensil sizes, packing density, thickness
- Confidence: high = clearly identifiable common food, medium = likely but uncertain, low = guessing
- List each component separately — don't combine a whole meal as one item
- Note cooking method when relevant for macros: "pan-fried" vs "steamed" chicken
- If you see sauce, dressing, or oil — list it as its own component
- Return an empty components array [] if you cannot identify any food`;

const TEXT_SYSTEM = `You are a food logging assistant. The user describes a meal in text.
Extract each food component and estimate grams from the description.
Return the SAME JSON shape as the vision system.
If amounts are given ("a cup of rice"), convert to grams. If amounts are vague, use typical portions.
Flag low confidence when guessing.`;

// ─── API call ─────────────────────────────────────────────────────────────────

interface ComponentsResponse {
  components: AiMealComponent[];
  overallConfidence?: "high" | "medium" | "low";
  uncertainties?: string[];
}

async function callHaiku(
  messages: { role: string; content: unknown }[],
  system: string,
): Promise<ComponentsResponse> {
  if (!API_KEY) throw new Error("AI logging is not configured");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`AI request failed: ${err.slice(0, 200)}`);
  }

  const json = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = json.content.find((c) => c.type === "text")?.text ?? "{}";
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as ComponentsResponse;
    if (!Array.isArray(parsed.components)) return { components: [] };
    // Validate + clean each component
    parsed.components = parsed.components.filter(
      (c): c is AiMealComponent =>
        typeof c === "object" &&
        typeof c.name === "string" &&
        typeof c.estimatedGrams === "number" &&
        c.estimatedGrams > 0,
    );
    return parsed;
  } catch {
    return { components: [] };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Identify meal components from a photo (+ optional text description).
 * Returns component names + gram estimates; macros must be looked up separately.
 */
export async function identifyMealComponents(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  description?: string,
): Promise<ComponentsResponse> {
  const userContent: unknown[] = [
    { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
    {
      type: "text",
      text: description
        ? `I can see this meal. Additional context from the person: "${description}"\n\nIdentify each food component and estimate grams per the schema.`
        : "Identify each food component visible and estimate grams per the schema.",
    },
  ];

  return callHaiku([{ role: "user", content: userContent }], VISION_SYSTEM);
}

/**
 * Identify meal components from text description only (no photo).
 */
export async function identifyMealFromText(description: string): Promise<ComponentsResponse> {
  return callHaiku(
    [{ role: "user", content: `Meal description: "${description}"\n\nExtract each food component and estimate grams per the schema.` }],
    TEXT_SYSTEM,
  );
}

// ─── Common hidden-extra suggestions ─────────────────────────────────────────

/** Foods commonly under-counted that we should prompt the user about. */
export const HIDDEN_EXTRAS = [
  { name: "Cooking oil or butter", searchTerm: "vegetable oil", typicalGrams: 10, emoji: "🫒" },
  { name: "Salad dressing", searchTerm: "italian salad dressing", typicalGrams: 30, emoji: "🥗" },
  { name: "Sauce or gravy", searchTerm: "pasta sauce tomato", typicalGrams: 60, emoji: "🥫" },
  { name: "Drink (not water)", searchTerm: "orange juice", typicalGrams: 240, emoji: "🥤" },
  { name: "Cheese", searchTerm: "cheddar cheese", typicalGrams: 28, emoji: "🧀" },
  { name: "Bread or roll", searchTerm: "white bread", typicalGrams: 50, emoji: "🍞" },
] as const;
