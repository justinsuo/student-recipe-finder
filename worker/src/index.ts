/**
 * Student Recipe Finder API — Cloudflare Worker
 *
 * Proxies OpenAI calls so the OPENAI_API_KEY stays server-side. The frontend
 * (static export hosted on GitHub Pages) calls these endpoints with CORS.
 *
 * Endpoints:
 *   POST /ingredients/resolve   — parse a phrase into structured ingredient list
 *   POST /ingredients/enrich    — classify a single custom ingredient
 *   POST /ingredients/match     — semantic recipe ↔ pantry match check
 *   POST /generate-recipe       — AI Chef recipe generator
 *   POST /generate-recipe-image — auto image generation for recipes
 *   GET  /health                — health check
 */

interface Env {
  OPENAI_API_KEY: string;
  ALLOWED_ORIGIN?: string;
  DEFAULT_TEXT_MODEL?: string;
  DEFAULT_IMAGE_MODEL?: string;
}

const TEXT_MODEL_DEFAULT = "gpt-4o-mini";
const IMAGE_MODEL_DEFAULT = "gpt-image-1";

// ---------- CORS ----------

function corsHeaders(env: Env, origin: string | null): HeadersInit {
  // If ALLOWED_ORIGIN is set, use it; otherwise reflect the request origin.
  // This lets the worker work for both prod (GH Pages) and local dev.
  const allow = env.ALLOWED_ORIGIN || origin || "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  env: Env,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(env, origin),
    },
  });
}

// ---------- OpenAI client ----------

async function openaiChatJson(opts: {
  env: Env;
  system: string;
  user: string;
  schema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}): Promise<unknown> {
  const model = opts.env.DEFAULT_TEXT_MODEL || TEXT_MODEL_DEFAULT;
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    max_tokens: opts.maxTokens ?? 1200,
    temperature: opts.temperature ?? 0.4,
    response_format: { type: "json_object" },
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned non-JSON content: " + content.slice(0, 200));
  }
}

async function openaiImage(
  env: Env,
  prompt: string,
  size: "1024x1024" | "1024x1536" | "1536x1024" = "1024x1024",
): Promise<{ b64_json?: string; url?: string }> {
  const model = env.DEFAULT_IMAGE_MODEL || IMAGE_MODEL_DEFAULT;
  const body = {
    model,
    prompt,
    n: 1,
    size,
  };
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI image ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const first = json.data?.[0];
  if (!first) throw new Error("No image returned");
  return first;
}

// ---------- Route: /ingredients/resolve ----------

const RESOLVER_SYSTEM = `You are an expert ingredient normalization engine for a student cooking app.

Convert messy user input (typed, pasted, or transcribed from voice) into clean, canonical ingredient objects.

NEVER split a multi-word ingredient into separate ingredients. Examples:
- "apple cider vinegar" is ONE ingredient, not apple + cider + vinegar.
- "extra virgin olive oil" is ONE ingredient.
- "everything bagel seasoning" is ONE ingredient.
- "frozen peas and carrots" is one mixed ingredient.
- "peanut butter" is ONE ingredient.
- "hot cheetos" is ONE ingredient.
- "laoganma chili crisp" is ONE ingredient.
- "greek yogurt" is ONE ingredient.
- "canned black beans" is ONE ingredient with descriptor.
- "old tortillas" is tortillas with a use-soon note.

Multiple ingredients in one phrase: "rice eggs soy sauce" -> three ingredients.

Always respond with ONLY valid JSON in this exact schema:
{
  "ingredients": [
    {
      "canonicalName": "<string, properly capitalized>",
      "displayName": "<string, same as canonicalName or original phrasing>",
      "originalText": "<the user's exact words for this item>",
      "aliases": ["string"],
      "category": "grains-and-starches|pasta-and-noodles|beans-and-lentils|canned-goods|frozen|fresh-vegetables|fruit|eggs-and-dairy|meat-and-seafood|tofu-and-plant-protein|condiments-and-sauces|spices|bread-and-tortillas|snacks|beverages|baking|other",
      "ingredientRole": "main|protein|carb|vegetable|fruit|fat|seasoning|sauce|acid|sweetener|binder|liquid|other",
      "storageType": "pantry|fridge|freezer|unknown",
      "shelfLifeDays": <number or null>,
      "estimatedUnitCost": <number USD or null>,
      "unit": "<unit like cup, tbsp, can, each>",
      "dietaryTags": ["vegan|vegetarian|gluten-free|dairy-free|high-protein"],
      "allergyTags": ["contains-nuts|contains-soy|contains-dairy|contains-gluten|contains-egg|contains-fish"],
      "confidence": <0..1>,
      "notes": "<optional short note like 'use soon' or 'half a bag'>",
      "useSoon": <boolean>
    }
  ],
  "ignoredText": ["fragments that were not food"],
  "clarificationNeeded": <boolean>,
  "clarificationQuestion": "<optional question if input is truly ambiguous>"
}

Never return an error. Even if the ingredient is unknown, branded, regional, or misspelled, classify it as best you can.`;

async function handleResolve(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: { rawInput?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const raw = (body.rawInput || "").toString().trim();
  if (!raw) {
    return jsonResponse(
      { ingredients: [], ignoredText: [], clarificationNeeded: false },
      200,
      env,
      origin,
    );
  }
  if (raw.length > 2000) {
    return jsonResponse({ error: "Input too long (max 2000 chars)" }, 400, env, origin);
  }
  try {
    const result = await openaiChatJson({
      env,
      system: RESOLVER_SYSTEM,
      user: `User input (source: ${(body as { inputSource?: string }).inputSource || "typed"}):\n"${raw}"\n\nReturn JSON per the schema.`,
      maxTokens: 1500,
      temperature: 0.1,
    });
    return jsonResponse(result, 200, env, origin);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "resolve failed" },
      500,
      env,
      origin,
    );
  }
}

// ---------- Route: /ingredients/enrich ----------

const ENRICH_SYSTEM = `You are an ingredient knowledge assistant for a student cooking app. Given a single ingredient name, classify it and provide useful metadata for pantry/cost/storage/recipe matching.

The ingredient may be uncommon, branded, regional, or misspelled. Do not reject ingredients just because they are not in a database. Make the best practical classification.

Always respond with ONLY valid JSON:
{
  "canonicalName": "string",
  "category": "<same enum as resolver>",
  "aliases": ["string"],
  "estimatedUnitCost": <number USD or null>,
  "unit": "string",
  "commonPackageSize": "string or null",
  "storageType": "pantry|fridge|freezer|unknown",
  "shelfLifeDays": <number or null>,
  "ingredientRole": "<same enum>",
  "dietaryTags": ["string"],
  "allergyTags": ["string"],
  "substitutes": ["string"],
  "recipeUseCases": ["string"],
  "isPantryStaple": <boolean>
}`;

async function handleEnrich(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const name = (body.name || "").toString().trim();
  if (!name) return jsonResponse({ error: "Missing name" }, 400, env, origin);
  try {
    const result = await openaiChatJson({
      env,
      system: ENRICH_SYSTEM,
      user: `Ingredient: "${name}"`,
      maxTokens: 600,
      temperature: 0.2,
    });
    return jsonResponse(result, 200, env, origin);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "enrich failed" },
      500,
      env,
      origin,
    );
  }
}

// ---------- Route: /ingredients/match ----------

const MATCH_SYSTEM = `You are a recipe ingredient matcher. Given a user's pantry ingredient and a recipe's required ingredient, decide whether the pantry item satisfies (or could substitute for) the recipe requirement.

Always respond with ONLY valid JSON:
{
  "isMatch": <boolean>,
  "matchType": "exact|alias|fuzzy|semantic|category|substitute|none",
  "confidence": <0..1>,
  "explanation": "one short sentence"
}

Examples:
- Apple cider vinegar matches vinegar (alias). isMatch=true, matchType="alias".
- Sriracha matches hot sauce (substitute). isMatch=true, matchType="substitute".
- Greek yogurt substitutes for sour cream. isMatch=true, matchType="substitute".
- Black beans match beans. isMatch=true, matchType="category".`;

async function handleMatch(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: { pantry?: string; required?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const pantry = (body.pantry || "").toString().trim();
  const required = (body.required || "").toString().trim();
  if (!pantry || !required) {
    return jsonResponse({ error: "Missing pantry/required" }, 400, env, origin);
  }
  try {
    const result = await openaiChatJson({
      env,
      system: MATCH_SYSTEM,
      user: `Pantry item: "${pantry}"\nRecipe needs: "${required}"`,
      maxTokens: 200,
      temperature: 0.1,
    });
    return jsonResponse(result, 200, env, origin);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "match failed" },
      500,
      env,
      origin,
    );
  }
}

// ---------- Route: /generate-recipe ----------

const RECIPE_SYSTEM = `You are an expert budget cooking assistant for college students. Generate practical, cheap, creative recipes based on the user's available ingredients, budget, equipment, time limit, dietary needs, and cravings.

Your recipes must be realistic for students in dorms, apartments, or shared kitchens. Prioritize affordability, pantry staples, minimal cleanup, and clear instructions.

Use the user's existing ingredients as much as possible. Only add missing ingredients if they are cheap and meaningfully improve the recipe. Estimate costs realistically in USD. Keep cost per serving at or below the user's budget when possible.

Respect equipment constraints strictly. If the user only has a microwave, do not include stovetop, oven, or air fryer steps. If the user has an air fryer, include temperature, time, flip/shake reminders, and doneness checks. Include safety notes naturally (microwave-safe bowls, no metal in microwave, pierce potatoes before microwaving, steam caution, chicken cooked through, air fryer basket spacing).

Always respond with ONLY valid JSON matching this schema (no markdown):
{
  "name": "string",
  "description": "1–2 sentence original description",
  "userRequestSummary": "1 sentence echoing what the user asked for",
  "whyThisFits": "1–2 sentences explaining why this recipe matches the user's request",
  "mealType": "breakfast|lunch|dinner|snack|meal-prep",
  "cuisineStyle": "string",
  "servings": <number 1-6>,
  "prepTimeMinutes": <number>,
  "cookTimeMinutes": <number>,
  "totalTimeMinutes": <number>,
  "difficulty": "very easy|easy|medium",
  "equipment": ["microwave|air-fryer|stovetop|oven|rice-cooker|no-kitchen"],
  "primaryCookingMethod": "microwave|air-fryer|stovetop|oven|rice-cooker|no-cook|mixed",
  "noStovetopRequired": <boolean>,
  "estimatedTotalCost": <number USD>,
  "estimatedCostPerServing": <number USD>,
  "estimatedMissingIngredientCost": <number USD>,
  "ingredients": [
    {"name": "string", "quantity": <number>, "unit": "string", "estimatedCost": <number>, "userAlreadyHas": <boolean>, "optional": <boolean>, "category": "string"}
  ],
  "missingIngredients": [
    {"name": "string", "estimatedCost": <number>, "importance": "required|recommended|optional", "cheapSubstitute": "string or null"}
  ],
  "steps": ["string", ...],
  "guidedCookingSteps": [
    {"title": "string", "instruction": "string", "timerMinutes": <number or null>, "safetyNote": "string or null"}
  ],
  "cheapTips": ["string"],
  "substitutions": [{"original": "string", "swap": "string", "why": "string", "estimatedSavings": <number or null>}],
  "makeItCheaper": ["string"],
  "makeItHealthier": ["string"],
  "makeItHigherProtein": ["string"],
  "pantryStaplesUsed": ["string"],
  "optionalAddIns": ["string"],
  "studentTips": ["string"],
  "storageInstructions": "string",
  "reheatingInstructions": "string",
  "safetyNotes": ["string"],
  "estimatedNutrition": {"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "fiber": <number>},
  "tags": ["string"],
  "imagePromptHint": "1-sentence visual description, no people, no text, no branding"
}`;

async function handleGenerateRecipe(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const userPrompt = buildRecipeUserPrompt(body);
  try {
    const result = await openaiChatJson({
      env,
      system: RECIPE_SYSTEM,
      user: userPrompt,
      maxTokens: 3000,
      temperature: 0.6,
    });
    return jsonResponse(result, 200, env, origin);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "generation failed" },
      500,
      env,
      origin,
    );
  }
}

function buildRecipeUserPrompt(body: Record<string, unknown>): string {
  const lines: string[] = [];
  const have = (body.ingredients as string[]) || [];
  if (have.length) lines.push(`Ingredients I already have: ${have.join(", ")}`);
  const budget = body.budgetPerServing as number | undefined;
  if (budget) lines.push(`Budget per serving: $${budget}`);
  const servings = body.servings as number | undefined;
  if (servings) lines.push(`Servings: ${servings}`);
  const equipment = (body.equipment as string[]) || [];
  if (equipment.length) lines.push(`Equipment available: ${equipment.join(", ")}`);
  const time = body.timeLimit as string | undefined;
  if (time) lines.push(`Time limit: ${time}`);
  const diet = (body.dietTags as string[]) || [];
  if (diet.length) lines.push(`Diet: ${diet.join(", ")}`);
  const mealType = body.mealType as string | undefined;
  if (mealType) lines.push(`Meal type: ${mealType}`);
  const cravings = body.cravings as string | undefined;
  if (cravings) lines.push(`Craving / free-text request: ${cravings}`);
  const creativity = body.creativity as string | undefined;
  if (creativity) lines.push(`Creativity: ${creativity}`);
  const refinement = body.refinement as string | undefined;
  if (refinement) lines.push(`Refinement: ${refinement}`);
  lines.push("\nReturn ONLY valid JSON matching the schema.");
  return lines.join("\n");
}

// ---------- Route: /generate-recipe-image ----------

async function handleGenerateImage(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: { recipeName?: string; prompt?: string; ingredients?: string[]; method?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const prompt = body.prompt
    ? body.prompt
    : buildImagePrompt(body.recipeName || "", body.ingredients || [], body.method);
  if (!prompt) return jsonResponse({ error: "Missing prompt" }, 400, env, origin);
  try {
    const image = await openaiImage(env, prompt, "1024x1024");
    return jsonResponse(
      {
        b64_json: image.b64_json,
        url: image.url,
        prompt,
        model: env.DEFAULT_IMAGE_MODEL || IMAGE_MODEL_DEFAULT,
      },
      200,
      env,
      origin,
    );
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "image generation failed" },
      500,
      env,
      origin,
    );
  }
}

function buildImagePrompt(
  name: string,
  ingredients: string[],
  method?: string,
): string {
  const base =
    "Realistic homemade food photography, natural lighting, simple student apartment kitchen setting, appetizing but not overly polished, budget-friendly ingredients, casual plating, no text, no watermark, no logo, no people, no branded packaging";
  const methodHint = method?.includes("air-fryer")
    ? "Crisp golden-brown edges, served in a bowl or on a plate, visible texture."
    : method === "microwave"
      ? "Served in a microwave-safe bowl or mug on a dorm desk, soft realistic texture, practical."
      : "Casual serving vessel, realistic homemade look.";
  const ingredientList = ingredients.slice(0, 6).join(", ");
  return `${name}. ${methodHint} Visible ingredients: ${ingredientList}. ${base}.`;
}

// ---------- Main router ----------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin");

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true }, 200, env, origin);
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, env, origin);
    }

    switch (url.pathname) {
      case "/ingredients/resolve":
        return handleResolve(req, env);
      case "/ingredients/enrich":
        return handleEnrich(req, env);
      case "/ingredients/match":
        return handleMatch(req, env);
      case "/generate-recipe":
        return handleGenerateRecipe(req, env);
      case "/generate-recipe-image":
        return handleGenerateImage(req, env);
      default:
        return jsonResponse({ error: "Not found" }, 404, env, origin);
    }
  },
};
