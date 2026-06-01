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

// ---------- Route: /recipes/import-url ----------
//
// Fetches a public recipe URL, prefers schema.org JSON-LD `Recipe` data, and
// adapts the recipe to the user's pantry/equipment/budget if provided.

interface JsonLdRecipe {
  "@type"?: string | string[];
  name?: string;
  description?: string;
  image?: string | { url?: string } | Array<string | { url?: string }>;
  author?: string | { name?: string } | Array<string | { name?: string }>;
  recipeIngredient?: string[];
  recipeInstructions?:
    | string
    | Array<string | { text?: string; name?: string }>;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string | number;
  recipeCuisine?: string;
  datePublished?: string;
}

function isoDurationToMinutes(d?: string): number | undefined {
  if (!d) return undefined;
  // PT1H30M / PT45M / PT2H
  const m = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return undefined;
  return (parseInt(m[1] || "0", 10) * 60) + parseInt(m[2] || "0", 10);
}

function extractJsonLd(html: string): JsonLdRecipe[] {
  const found: JsonLdRecipe[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const txt = m[1].trim();
      const parsed = JSON.parse(txt);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of items) {
        if (!it) continue;
        if (it["@graph"] && Array.isArray(it["@graph"])) {
          for (const g of it["@graph"]) {
            if (g && (g["@type"] === "Recipe" || (Array.isArray(g["@type"]) && g["@type"].includes("Recipe")))) {
              found.push(g as JsonLdRecipe);
            }
          }
        }
        const t = it["@type"];
        if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) {
          found.push(it as JsonLdRecipe);
        }
      }
    } catch {
      // ignore unparsable script blocks
    }
  }
  return found;
}

function pickImage(img: JsonLdRecipe["image"]): string | undefined {
  if (!img) return undefined;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) {
    const first = img[0];
    return typeof first === "string" ? first : first?.url;
  }
  return img.url;
}

function pickAuthor(a: JsonLdRecipe["author"]): string | undefined {
  if (!a) return undefined;
  if (typeof a === "string") return a;
  if (Array.isArray(a)) {
    const first = a[0];
    return typeof first === "string" ? first : first?.name;
  }
  return a.name;
}

function pickSteps(i: JsonLdRecipe["recipeInstructions"]): string[] {
  if (!i) return [];
  if (typeof i === "string") {
    return i.split(/\n+|(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
  }
  return i
    .map((s) =>
      typeof s === "string"
        ? s
        : (s as { text?: string; name?: string }).text ??
          (s as { text?: string; name?: string }).name ??
          "",
    )
    .map((s) => s.trim())
    .filter(Boolean);
}

const IMPORT_ADAPT_SYSTEM = `You adapt a real recipe to a student's pantry, budget, and equipment without copying long passages verbatim. You receive a structured recipe (ingredients, steps, time, servings) plus the user's constraints.

Rewrite the recipe in your own words. Keep the dish name and any well-known technique references; do not copy long instructional sentences verbatim. Adapt servings, ingredients, and equipment so they fit the user's constraints. Include source attribution metadata (provided separately) — do not invent a source.

Always respond with ONLY valid JSON matching this schema (same as /generate-recipe). No markdown.

Set imagePromptHint to a 1-sentence visual description.`;

async function handleImportUrl(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: {
    url?: string;
    ingredients?: string[];
    budgetPerServing?: number;
    equipment?: string[];
    dietTags?: string[];
    servings?: number;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const targetUrl = (body.url || "").toString().trim();
  if (!targetUrl || !/^https?:\/\//.test(targetUrl)) {
    return jsonResponse({ error: "Provide a valid http(s) URL" }, 400, env, origin);
  }
  try {
    const fetchRes = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "StudentRecipeFinder/1.0 (+https://github.com/justinsuo/student-recipe-finder) recipe-importer",
        Accept: "text/html,application/xhtml+xml",
      },
      cf: { cacheTtl: 0 } as RequestInitCfProperties,
      redirect: "follow",
    });
    if (!fetchRes.ok) {
      return jsonResponse(
        {
          error: `Source returned ${fetchRes.status}. The page may block automated access — try pasting the recipe text into the "Paste a recipe" mode instead.`,
        },
        502,
        env,
        origin,
      );
    }
    const html = await fetchRes.text();
    const recipes = extractJsonLd(html);
    if (recipes.length === 0) {
      // Fall back to giving the model the page title + a short cleaned snippet
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : targetUrl;
      const cleanText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 4000);
      const prompt = `Source URL: ${targetUrl}\nPage title: ${title}\nPage excerpt (may contain ads / non-recipe text):\n${cleanText}\n\nThe page has no structured recipe data. Extract whatever recipe you can find from the excerpt, then adapt it to the user's pantry (${(body.ingredients || []).join(", ") || "any"}), budget $${body.budgetPerServing ?? 3}/serving, equipment ${(body.equipment || []).join(", ") || "any"}, diet ${(body.dietTags || []).join(", ") || "none"}, servings ${body.servings ?? 2}. Return ONLY valid JSON in the recipe schema.`;
      const result = await openaiChatJson({
        env,
        system: RECIPE_SYSTEM,
        user: prompt,
        maxTokens: 3000,
        temperature: 0.4,
      });
      return jsonResponse(
        {
          recipe: result,
          source: {
            sourceType: "unknown-web",
            sourceUrl: targetUrl,
            citationRequired: true,
            attributionText: `Adapted from a recipe on ${new URL(targetUrl).hostname}`,
            transformedByAI: true,
            dateAccessed: new Date().toISOString(),
            structuredDataAvailable: false,
          },
        },
        200,
        env,
        origin,
      );
    }
    const ld = recipes[0];
    const summary = {
      name: ld.name ?? "Untitled recipe",
      description: ld.description ?? "",
      author: pickAuthor(ld.author) ?? "",
      image: pickImage(ld.image),
      ingredients: ld.recipeIngredient ?? [],
      steps: pickSteps(ld.recipeInstructions),
      totalTimeMinutes: isoDurationToMinutes(ld.totalTime),
      prepTimeMinutes: isoDurationToMinutes(ld.prepTime),
      cookTimeMinutes: isoDurationToMinutes(ld.cookTime),
      yield: ld.recipeYield,
      cuisine: ld.recipeCuisine,
      datePublished: ld.datePublished,
    };
    const adaptPrompt = `Source structured recipe (paraphrase, do not copy verbatim):\n${JSON.stringify(summary, null, 2)}\n\nUser constraints:\n- Ingredients on hand: ${(body.ingredients || []).join(", ") || "any"}\n- Budget per serving: $${body.budgetPerServing ?? 3}\n- Equipment: ${(body.equipment || []).join(", ") || "any"}\n- Diet: ${(body.dietTags || []).join(", ") || "none"}\n- Target servings: ${body.servings ?? summary.yield ?? 2}\n\nRewrite as JSON per the schema. Keep the dish name; adapt steps to user equipment.`;
    const result = await openaiChatJson({
      env,
      system: IMPORT_ADAPT_SYSTEM + "\n\n" + RECIPE_SYSTEM,
      user: adaptPrompt,
      maxTokens: 3000,
      temperature: 0.5,
    });
    return jsonResponse(
      {
        recipe: result,
        source: {
          sourceType: "recipe-site",
          sourceUrl: targetUrl,
          sourceName: new URL(targetUrl).hostname,
          creatorName: pickAuthor(ld.author),
          imageUrl: pickImage(ld.image),
          datePublished: ld.datePublished,
          dateAccessed: new Date().toISOString(),
          citationRequired: true,
          attributionText: pickAuthor(ld.author)
            ? `Adapted from a recipe by ${pickAuthor(ld.author)} on ${new URL(targetUrl).hostname}`
            : `Adapted from a recipe on ${new URL(targetUrl).hostname}`,
          transformedByAI: true,
          structuredDataAvailable: true,
        },
      },
      200,
      env,
      origin,
    );
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "URL import failed" },
      500,
      env,
      origin,
    );
  }
}

// ---------- Route: /recipes/import-text ----------
//
// Accepts a pasted social caption / transcript / handwritten recipe and turns
// it into a structured recipe. Used when the source platform blocks
// programmatic access (TikTok, Instagram, etc.) — the user can paste the
// caption manually and the recipe gets built from that.

async function handleImportText(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: {
    text?: string;
    sourceUrl?: string;
    sourcePlatform?: string;
    creatorName?: string;
    ingredients?: string[];
    budgetPerServing?: number;
    equipment?: string[];
    dietTags?: string[];
    servings?: number;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const text = (body.text || "").toString().trim();
  if (!text) return jsonResponse({ error: "Missing text" }, 400, env, origin);
  if (text.length > 10000) {
    return jsonResponse({ error: "Text too long (max 10000 chars)" }, 400, env, origin);
  }
  const userPrompt = `Pasted source text (may be a TikTok caption, blog excerpt, Instagram description, or any messy recipe content). Extract a clean recipe and adapt to the user's constraints.

Source text:
"""
${text}
"""

User constraints:
- Ingredients on hand: ${(body.ingredients || []).join(", ") || "any"}
- Budget per serving: $${body.budgetPerServing ?? 3}
- Equipment: ${(body.equipment || []).join(", ") || "any"}
- Diet: ${(body.dietTags || []).join(", ") || "none"}
- Servings: ${body.servings ?? 2}
${body.sourceUrl ? `- Source URL: ${body.sourceUrl}` : ""}
${body.creatorName ? `- Creator: ${body.creatorName}` : ""}

Return ONLY valid JSON per the recipe schema. Paraphrase steps; do not copy long passages from the source.`;
  try {
    const result = await openaiChatJson({
      env,
      system: IMPORT_ADAPT_SYSTEM + "\n\n" + RECIPE_SYSTEM,
      user: userPrompt,
      maxTokens: 3000,
      temperature: 0.5,
    });
    return jsonResponse(
      {
        recipe: result,
        source: {
          sourceType:
            body.sourcePlatform === "tiktok"
              ? "tiktok"
              : body.sourcePlatform === "instagram"
                ? "instagram"
                : body.sourcePlatform === "youtube"
                  ? "youtube"
                  : "manual-user-link",
          sourceUrl: body.sourceUrl,
          creatorName: body.creatorName,
          dateAccessed: new Date().toISOString(),
          citationRequired: !!body.sourceUrl,
          attributionText: body.sourceUrl
            ? `Adapted from a recipe by ${body.creatorName || "the original creator"}${body.sourcePlatform ? ` on ${body.sourcePlatform}` : ""}`
            : "Adapted from user-pasted source",
          transformedByAI: true,
          importedFromUserLink: !!body.sourceUrl,
          structuredDataAvailable: false,
        },
      },
      200,
      env,
      origin,
    );
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "text import failed" },
      500,
      env,
      origin,
    );
  }
}

// ---------- Route: /recipes/web-search ----------
//
// Uses the OpenAI Responses API with the built-in web_search tool to find a
// handful of real recipes online and return them in our structured schema.

const DISCOVER_SYSTEM = `You are a budget recipe research assistant. The user describes a meal idea, ingredients, or constraints. You search the web for real recipes (food blogs, recipe sites, public posts) that match.

Return ONLY valid JSON of the shape:
{
  "candidates": [
    {
      "name": "string",
      "summary": "1-2 sentences in your own words, not copied",
      "sourceUrl": "https://...",
      "sourceName": "blog or site name",
      "creatorName": "string or null",
      "estimatedTotalTimeMinutes": <number or null>,
      "estimatedServings": <number or null>,
      "detectedIngredients": ["string"],
      "detectedEquipment": ["microwave","stovetop","oven","rice-cooker","air-fryer","no-kitchen"],
      "dietTags": ["vegan","vegetarian","high-protein","gluten-free","dairy-free"],
      "whyRecommended": "1 sentence",
      "imageUrl": "https://... or null"
    }
  ]
}

Rules:
- Never copy more than a sentence of the original blog text. Summarize in your own words.
- Always include sourceUrl.
- Prefer simple, student-friendly, budget recipes.
- If the user gives ingredients, prioritize recipes that use most of them.
- Return at most 5 candidates. Quality over quantity.`;

async function handleWebSearch(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: {
    ingredients?: string[];
    cravings?: string;
    equipment?: string[];
    dietTags?: string[];
    budgetPerServing?: number;
    maxResults?: number;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  const max = Math.min(Math.max(body.maxResults || 5, 1), 5);
  const query = buildSearchQuery(body);
  const userPrompt = `User wants: ${query}\nTarget: at most ${max} candidates.\nReturn JSON per the schema.`;
  try {
    const result = await openaiResponsesWithWebSearch({
      env,
      system: DISCOVER_SYSTEM,
      user: userPrompt,
      maxTokens: 2000,
    });
    return jsonResponse(result, 200, env, origin);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "web search failed" },
      500,
      env,
      origin,
    );
  }
}

function buildSearchQuery(b: {
  ingredients?: string[];
  cravings?: string;
  equipment?: string[];
  dietTags?: string[];
  budgetPerServing?: number;
}): string {
  const parts: string[] = [];
  if (b.cravings) parts.push(b.cravings);
  if (b.ingredients?.length) parts.push(`using ${b.ingredients.join(", ")}`);
  if (b.equipment?.length) parts.push(`for ${b.equipment.join(", ")}`);
  if (b.dietTags?.length) parts.push(b.dietTags.join(", "));
  if (b.budgetPerServing) parts.push(`under $${b.budgetPerServing}/serving`);
  parts.push("student-friendly cheap recipe");
  return parts.join(", ");
}

async function openaiResponsesWithWebSearch(opts: {
  env: Env;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<unknown> {
  const model = opts.env.DEFAULT_TEXT_MODEL || TEXT_MODEL_DEFAULT;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      tools: [{ type: "web_search" }],
      max_output_tokens: opts.maxTokens ?? 2000,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI Responses ${res.status}: ${text.slice(0, 300)}`);
  }
  type ResponsesPayload = {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };
  const json = (await res.json()) as ResponsesPayload;
  // Responses API output shape varies — try a few accessors
  let raw = json.output_text;
  if (!raw && Array.isArray(json.output)) {
    for (const block of json.output) {
      if (Array.isArray(block.content)) {
        for (const c of block.content) {
          if (c.type === "output_text" && typeof c.text === "string") {
            raw = c.text;
          }
        }
      }
    }
  }
  if (!raw) throw new Error("Responses API returned no text");
  // Find JSON in the response (model may add surrounding prose)
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const slice = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;
  try {
    return JSON.parse(slice);
  } catch {
    throw new Error("Responses API returned non-JSON output");
  }
}

// ---------- Route: /recipes/remix ----------
//
// Refine an existing recipe (database, AI, imported, or user-created) per a
// user request like "make it cheaper" / "microwave only" / "higher protein".

async function handleRemix(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let body: {
    baseRecipe?: Record<string, unknown>;
    userRequest?: string;
    pantryIngredients?: string[];
    budgetPerServing?: number;
    equipment?: string[];
    dietTags?: string[];
    preserveSourceAttribution?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, env, origin);
  }
  if (!body.baseRecipe) {
    return jsonResponse({ error: "Missing baseRecipe" }, 400, env, origin);
  }
  const prompt = `Existing recipe (use only structured facts, do not copy long passages):\n${JSON.stringify(body.baseRecipe).slice(0, 6000)}\n\nUser remix request: ${body.userRequest || "make it better"}\n\nUser constraints:\n- Pantry: ${(body.pantryIngredients || []).join(", ") || "any"}\n- Budget per serving: $${body.budgetPerServing ?? 3}\n- Equipment: ${(body.equipment || []).join(", ") || "any"}\n- Diet: ${(body.dietTags || []).join(", ") || "none"}\n\nReturn ONLY valid JSON per the schema. ${body.preserveSourceAttribution ? "Preserve the original source attribution in your output's whyThisFits." : ""}`;
  try {
    const result = await openaiChatJson({
      env,
      system: RECIPE_SYSTEM,
      user: prompt,
      maxTokens: 3000,
      temperature: 0.5,
    });
    return jsonResponse(result, 200, env, origin);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "remix failed" },
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
      case "/recipes/import-url":
        return handleImportUrl(req, env);
      case "/recipes/import-text":
        return handleImportText(req, env);
      case "/recipes/web-search":
        return handleWebSearch(req, env);
      case "/recipes/remix":
        return handleRemix(req, env);
      default:
        return jsonResponse({ error: "Not found" }, 404, env, origin);
    }
  },
};
