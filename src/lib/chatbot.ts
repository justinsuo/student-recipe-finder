import { INGREDIENTS, INGREDIENT_MAP } from "@/data/ingredients";
import { RECIPES } from "@/data/recipes";
import {
  calculateCostPerServing,
  rankCheapRecipes,
  rankPantryRecipes,
} from "@/lib/recipeScoring";
import type {
  DietTag,
  Equipment,
  MealType,
  PantryItem,
  Recipe,
} from "@/lib/types";

export interface ChatContext {
  pantry: PantryItem[];
  savedRecipeIds: string[];
}

export interface ChatReply {
  message: string;
  recipeIds?: string[];
}

// ----- Intent detection helpers -----

const DIET_KEYWORDS: Record<DietTag, string[]> = {
  vegan: ["vegan"],
  vegetarian: ["vegetarian", "veggie", "no meat"],
  "high-protein": ["high protein", "high-protein", "protein", "muscle", "gym"],
  "gluten-free": ["gluten free", "gluten-free", "gf"],
  "dairy-free": ["dairy free", "dairy-free"],
};

const EQUIPMENT_KEYWORDS: Record<Equipment, string[]> = {
  microwave: ["microwave"],
  stovetop: ["stovetop", "stove"],
  oven: ["oven"],
  "rice-cooker": ["rice cooker"],
  "air-fryer": ["air fryer", "air-fryer"],
  "no-kitchen": ["dorm", "no kitchen", "no-kitchen", "dorm-friendly"],
};

const MEAL_TYPE_KEYWORDS: Record<MealType, string[]> = {
  breakfast: ["breakfast", "morning"],
  lunch: ["lunch", "midday"],
  dinner: ["dinner", "supper", "evening"],
  snack: ["snack"],
  "meal-prep": ["meal prep", "meal-prep", "prep"],
};

function lc(s: string) {
  return s.toLowerCase();
}

function detectDiet(text: string): DietTag[] {
  const lower = lc(text);
  const out: DietTag[] = [];
  for (const [diet, kws] of Object.entries(DIET_KEYWORDS) as [DietTag, string[]][]) {
    if (kws.some((k) => lower.includes(k))) out.push(diet);
  }
  return out;
}

function detectEquipment(text: string): Equipment[] {
  const lower = lc(text);
  const out: Equipment[] = [];
  for (const [eq, kws] of Object.entries(EQUIPMENT_KEYWORDS) as [
    Equipment,
    string[],
  ][]) {
    if (kws.some((k) => lower.includes(k))) out.push(eq);
  }
  return out;
}

function detectMealType(text: string): MealType | undefined {
  const lower = lc(text);
  for (const [mt, kws] of Object.entries(MEAL_TYPE_KEYWORDS) as [
    MealType,
    string[],
  ][]) {
    if (kws.some((k) => lower.includes(k))) return mt;
  }
  return undefined;
}

function detectBudget(text: string): number | undefined {
  const match = text.match(/\$?\s?(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const value = parseFloat(match[1]);
  if (value > 50) return undefined; // ignore obviously-not-budget numbers
  if (value > 20) return value / 5; // assume total weekly budget for 5 servings
  return value;
}

function detectIngredients(text: string): string[] {
  const lower = lc(text);
  const out: string[] = [];
  for (const ing of INGREDIENTS) {
    const name = lc(ing.name);
    if (lower.includes(name)) {
      out.push(ing.id);
      continue;
    }
    // singular check (chickpea vs chickpeas etc)
    if (name.endsWith("s") && lower.includes(name.slice(0, -1))) {
      out.push(ing.id);
    }
  }
  return Array.from(new Set(out));
}

function detectMaxTime(text: string): number | undefined {
  const lower = lc(text);
  const tenMatch = lower.match(/(\d+)\s?(min|minutes)/);
  if (tenMatch) return parseInt(tenMatch[1], 10);
  if (lower.includes("quick") || lower.includes("fast")) return 15;
  return undefined;
}

// ----- Intent handlers -----

function formatRecipeLine(r: Recipe): string {
  const cps = calculateCostPerServing(r).toFixed(2);
  return `${r.emoji}  **${r.name}** — $${cps}/serving · ${r.totalTimeMinutes} min`;
}

function recipeListReply(intro: string, recipes: Recipe[]): ChatReply {
  if (recipes.length === 0) {
    return {
      message:
        `${intro}\n\nI couldn't find anything that matches exactly. Try loosening one constraint (a different diet, a different time limit, or a slightly higher budget).`,
    };
  }
  const top = recipes.slice(0, 4);
  const lines = top.map((r) => `- ${formatRecipeLine(r)}`).join("\n");
  return {
    message: `${intro}\n\n${lines}\n\nTap any card below to open the full recipe.`,
    recipeIds: top.map((r) => r.id),
  };
}

function handleCheapIntent(text: string): ChatReply | null {
  const lower = lc(text);
  const wantsCheap =
    lower.includes("cheap") ||
    lower.includes("budget") ||
    lower.includes("affordable") ||
    lower.includes("under $") ||
    /under\s*\d+/.test(lower);
  if (!wantsCheap) return null;

  const budget = detectBudget(text) ?? 3;
  const diet = detectDiet(text);
  const equipment = detectEquipment(text);
  const mealType = detectMealType(text);
  const maxTime = detectMaxTime(text);

  const ranked = rankCheapRecipes({
    budgetPerServing: budget,
    servings: 2,
    equipment: equipment.length > 0 ? equipment : [],
    diet,
    time: maxTime && maxTime <= 10 ? "under-10" : maxTime && maxTime <= 20 ? "under-20" : "under-30",
    mealType: mealType ?? "any",
  });

  const intro = `Here are the cheapest meals under $${budget.toFixed(2)}/serving${
    diet.length > 0 ? ` (${diet.join(", ")})` : ""
  }${equipment.length > 0 ? `, using ${equipment.join(", ")}` : ""}:`;
  return recipeListReply(
    intro,
    ranked.map((r) => r.recipe),
  );
}

function handlePantryIntent(text: string, ctx: ChatContext): ChatReply | null {
  const lower = lc(text);
  const wantsPantry =
    lower.includes("what can i make") ||
    lower.includes("what should i make") ||
    lower.includes("i have") ||
    lower.includes("my pantry") ||
    lower.includes("pantry") ||
    lower.includes("fridge");
  if (!wantsPantry) return null;

  // Combine pantry stored items + ingredients mentioned in the message
  const mentioned = detectIngredients(text);
  const combined: PantryItem[] = [
    ...ctx.pantry,
    ...mentioned
      .filter((id) => !ctx.pantry.some((p) => p.ingredientId === id))
      .map((id) => ({ ingredientId: id })),
  ];

  if (combined.length === 0) {
    return {
      message:
        "Tell me what you've got! For example: \"I have rice, eggs, and frozen vegetables\". Or add items on the Pantry page and I'll remember them.",
    };
  }

  const ranked = rankPantryRecipes(combined);
  const intro =
    combined.length === ctx.pantry.length
      ? "Based on your pantry, here's what you can make right now:"
      : `Using ${combined.map((c) => INGREDIENT_MAP.get(c.ingredientId)?.name).filter(Boolean).join(", ")}, here's what I'd cook:`;
  return recipeListReply(
    intro,
    ranked.map((r) => r.recipe),
  );
}

function handleProteinIntent(text: string): ChatReply | null {
  const lower = lc(text);
  if (!lower.includes("protein") && !lower.includes("gym") && !lower.includes("muscle"))
    return null;

  const sorted = [...RECIPES].sort(
    (a, b) => b.estimatedNutrition.protein - a.estimatedNutrition.protein,
  );
  const intro = "Top picks for high-protein eating on a budget:";
  return recipeListReply(intro, sorted.slice(0, 4));
}

function handleQuickIntent(text: string): ChatReply | null {
  const lower = lc(text);
  if (!lower.includes("quick") && !lower.includes("fast") && !lower.includes("hungry"))
    return null;

  const sorted = [...RECIPES].sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes);
  const intro = "Fastest recipes I've got — all 15 minutes or less:";
  return recipeListReply(
    intro,
    sorted.filter((r) => r.totalTimeMinutes <= 15).slice(0, 4),
  );
}

function handleGreeting(text: string): ChatReply | null {
  const lower = lc(text).trim();
  const greetings = ["hi", "hello", "hey", "yo", "sup", "howdy"];
  if (greetings.some((g) => lower === g || lower.startsWith(`${g} `) || lower.startsWith(`${g}!`))) {
    return {
      message:
        "Hey! I'm Pesto, your cheap-eats kitchen sidekick. Ask me things like:\n\n- \"What's a cheap high-protein dinner?\"\n- \"What can I make with rice and eggs?\"\n- \"Quick breakfast under $2\"\n- \"Vegan meal prep for the week\"",
    };
  }
  return null;
}

function handleHelp(text: string): ChatReply | null {
  const lower = lc(text);
  if (lower.includes("help") || lower.includes("what can you do") || lower.includes("how do you work")) {
    return {
      message:
        "I can help you find recipes by:\n\n- **Budget** — \"cheapest dinner under $2\"\n- **Pantry** — \"what can I make with tofu and rice?\"\n- **Diet** — \"vegan high-protein meals\"\n- **Time** — \"15 minute breakfast\"\n- **Equipment** — \"dorm-friendly microwave recipes\"\n\nI also know cheap swaps and meal-prep tips for every recipe. Try me!",
    };
  }
  return null;
}

function handleSavedRecipes(text: string, ctx: ChatContext): ChatReply | null {
  const lower = lc(text);
  if (!lower.includes("saved") && !lower.includes("favorite")) return null;
  if (ctx.savedRecipeIds.length === 0) {
    return {
      message:
        "You haven't saved any recipes yet. Hit the bookmark icon on any recipe card to save it — they'll all live on the Saved page.",
    };
  }
  const recipes = ctx.savedRecipeIds
    .map((id) => RECIPES.find((r) => r.id === id))
    .filter((r): r is Recipe => !!r);
  return recipeListReply("Here are your saved recipes:", recipes);
}

function handleFallback(text: string): ChatReply {
  // Try to find any recipe mention by name
  const lower = lc(text);
  const found = RECIPES.find((r) => lower.includes(lc(r.name)));
  if (found) {
    return {
      message: `Here's the rundown on **${found.name}** — $${calculateCostPerServing(found).toFixed(2)}/serving, ${found.totalTimeMinutes} min.\n\n${found.description}`,
      recipeIds: [found.id],
    };
  }
  // Default: show 3 random affordable picks
  const picks = [...RECIPES]
    .sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b))
    .slice(0, 3);
  return recipeListReply(
    "Not sure I caught that. Here are a few cheap student favorites to spark ideas — or ask me about a budget, ingredient, or diet:",
    picks,
  );
}

// ----- Main entrypoint -----

export function chatRespond(message: string, context: ChatContext): ChatReply {
  const handlers = [
    handleGreeting,
    handleHelp,
    (t: string) => handleSavedRecipes(t, context),
    (t: string) => handlePantryIntent(t, context),
    handleProteinIntent,
    handleQuickIntent,
    handleCheapIntent,
  ];
  for (const h of handlers) {
    const reply = h(message);
    if (reply) return reply;
  }
  return handleFallback(message);
}
