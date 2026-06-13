import { INGREDIENTS } from "../src/data/ingredients";
import { matchIngredientByName } from "../src/lib/nutritionEngine";
import fs from "fs";

// British/synonym → catalog-friendly names (shared with TheMealDB importer).
const SYN: Record<string, string> = {
  aubergine: "eggplant", courgette: "zucchini", courgettes: "zucchini",
  prawns: "shrimp", "king prawns": "shrimp", rocket: "arugula", chilli: "chili",
  chillies: "chili", "scotch bonnet": "chili", coriander: "cilantro",
  "spring onions": "green onion", "spring onion": "green onion", shallots: "shallot",
  swede: "turnip", sweetcorn: "corn", passata: "tomato sauce",
  "creme fraiche": "sour cream", "double cream": "heavy cream", "single cream": "cream",
  mince: "ground beef", "beef mince": "ground beef", "minced beef": "ground beef",
  "ground meat": "ground beef", rashers: "bacon", gammon: "ham", "plain flour": "flour",
  "all-purpose flour": "flour", "self-raising flour": "flour", "corn flour": "cornstarch",
  cornflour: "cornstarch", "caster sugar": "sugar", "granulated sugar": "sugar",
  "icing sugar": "powdered sugar", "demerara sugar": "brown sugar",
  "bicarbonate of soda": "baking soda", treacle: "molasses", sultanas: "raisins",
  "natural yogurt": "yogurt", "plain yogurt": "yogurt", "greek yoghurt": "greek yogurt",
  baguette: "bread", "wholemeal bread": "bread", "white bread": "bread", squid: "calamari",
  beetroot: "beet", "vanilla extract": "vanilla", "vegetable oil": "oil",
  "sunflower oil": "oil", "canola oil": "oil", "kosher salt": "salt", "sea salt": "salt",
  "black pepper": "pepper", "ground black pepper": "pepper", scallions: "green onion",
  scallion: "green onion", cilantro: "cilantro", "soy sauce": "soy sauce",
  "extra virgin olive oil": "olive oil", "extra-virgin olive oil": "olive oil",
};

function resolveId(name: string): string | null {
  const n = name.toLowerCase().replace(/^\d+[\s\d/.-]*/, "").trim();
  const syn = SYN[n] || n;
  const m = matchIngredientByName(syn);
  return m || null;
}

function parseQty(measure: string): number {
  if (!measure) return 1;
  const s = measure.toLowerCase().trim();
  let total = 0, found = false;
  for (const tok of s.split(/\s+/)) {
    const frac = tok.match(/^(\d+)\/(\d+)$/);
    const num = tok.match(/^(\d+(?:\.\d+)?)$/);
    if (frac) { total += parseInt(frac[1]) / parseInt(frac[2]); found = true; }
    else if (num) { total += parseFloat(num[1]); found = true; }
    else if (found) break;
  }
  if (!found) return 1;
  const kg = /\bkg\b/.test(s) ? 1000 : 1;
  const isMass = /\b(g|gram|grams|ml|kg|l|litre|lb|lbs|pound|oz|ounce)\b/.test(s) || total > 30;
  const q = isMass ? (total * kg) / 28 : total;
  return Math.max(0.5, Math.min(20, q));
}

// AI sometimes returns numbers as strings with units ("38g", "$3.20", "4 servings").
function num(v: any, d: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const x = parseFloat(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(x) ? x : d;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

const VALID_DIET = new Set(["vegetarian", "vegan", "high-protein", "gluten-free", "dairy-free"]);
const VALID_DIFF = new Set(["easy", "medium", "hard"]);
const VALID_MEAL = new Set(["breakfast", "lunch", "dinner", "snack", "meal-prep"]);

const full: Record<string, any> = JSON.parse(fs.readFileSync("/tmp/gen-recipes-full.json", "utf8"));
const images: Record<string, string> = JSON.parse(fs.readFileSync("/tmp/recipe-image-map.json", "utf8"));
const catalogUnit = new Map(INGREDIENTS.map((i) => [i.id, i.unit]));

// Collect unmapped ingredient names across all imaged recipes.
const newIngByName = new Map<string, { id: string; name: string; sample: string }>();
function newIngId(name: string): string {
  const key = name.toLowerCase().trim();
  if (!newIngByName.has(key)) newIngByName.set(key, { id: "gening-" + slug(name), name, sample: "" });
  return newIngByName.get(key)!.id;
}

const recipes = Object.values(full).filter((r: any) => images[r.id]);
console.log("generated:", Object.keys(full).length, "| with images:", recipes.length);

// Pre-scan to populate the unmapped-ingredient set.
for (const r of recipes) {
  for (const ing of r.ingredients || []) {
    const nm = (ing.name || "").trim();
    if (!nm) continue;
    if (!resolveId(nm)) {
      const id = newIngId(nm);
      const e = newIngByName.get(nm.toLowerCase().trim())!;
      if (!e.sample) e.sample = ing.amount || "";
    }
  }
}

const NEW_ING_PATH = "/tmp/gen-new-ingredients.json";
if (!fs.existsSync(NEW_ING_PATH)) {
  fs.writeFileSync("/tmp/gen-unmapped.json", JSON.stringify([...newIngByName.values()]));
  console.log("PHASE 1: wrote", newIngByName.size, "unmapped ingredient names → /tmp/gen-unmapped.json");
  console.log("Run the AI estimator to produce /tmp/gen-new-ingredients.json, then re-run this script.");
  process.exit(0);
}

// PHASE 2 — new-ingredient nutrition is ready.
const newNut: Record<string, any> = JSON.parse(fs.readFileSync(NEW_ING_PATH, "utf8")); // keyed by gening- id
const nutById: Record<string, any> = {};
const genIngredients: any[] = [];
for (const e of newIngByName.values()) {
  const d = newNut[e.id];
  if (!d) continue;
  genIngredients.push({
    id: e.id, name: e.name, category: d.category || "condiment",
    estimatedUnitCost: d.estimatedUnitCost ?? 0.3, unit: d.unit || "oz", tags: ["imported"],
  });
  nutById[e.id] = {
    calories: d.calories ?? 0, protein: d.protein ?? 0, carbs: d.carbs ?? 0,
    fat: d.fat ?? 0, fiber: d.fiber ?? 0, confidence: "low",
  };
}

const EMOJI_FALLBACK: Record<string, string> = {
  breakfast: "🍳", lunch: "🥗", dinner: "🍽️", snack: "🍪", "meal-prep": "🍱",
};
const ACCENTS = ["bg-orange-100", "bg-amber-100", "bg-rose-100", "bg-emerald-100", "bg-sky-100", "bg-violet-100", "bg-lime-100"];

const out: any[] = [];
const costs: Record<string, number> = {};
const photos: Record<string, string> = {};
let ai = 0;

recipes.forEach((r: any, idx: number) => {
  const ings: any[] = [];
  for (const ing of r.ingredients || []) {
    const nm = (ing.name || "").trim();
    if (!nm) continue;
    const id = resolveId(nm) || newIngId(nm);
    if (ings.some((x) => x.ingredientId === id)) continue;
    const entry: any = { ingredientId: id, quantity: parseQty(ing.amount || "") };
    if (ing.amount && /[a-z]/i.test(ing.amount)) entry.note = ing.amount.trim().slice(0, 40);
    ings.push(entry);
  }
  if (ings.length < 2) return;

  const steps: string[] = (r.steps || []).map((s: string) => String(s).trim()).filter((s: string) => s.length > 4).slice(0, 12);
  if (steps.length < 2) return;

  const mealType = VALID_MEAL.has(r.mealType) ? (r.mealType === "snack" ? "snack" : r.mealType) : "dinner";
  const difficulty = VALID_DIFF.has(r.difficulty) ? r.difficulty : "medium";
  const stepsText = steps.join(" ").toLowerCase();
  const equipment = /oven|bake|roast|broil/.test(stepsText) ? ["oven", "stovetop"] : ["stovetop"];
  const n = r.estimatedNutrition || {};
  const nutrition = {
    calories: Math.max(80, Math.min(1400, Math.round(num(n.calories, 420)))),
    protein: Math.max(1, Math.round(num(n.protein, 14) * 10) / 10),
    carbs: Math.max(1, Math.round(num(n.carbs, 40) * 10) / 10),
    fat: Math.max(1, Math.round(num(n.fat, 14) * 10) / 10),
    fiber: Math.max(0, Math.round(num(n.fiber, 3) * 10) / 10),
  };
  const diet = (Array.isArray(r.dietTags) ? r.dietTags : []).filter((d: string) => VALID_DIET.has(d));
  if (nutrition.protein >= 20 && !diet.includes("high-protein")) diet.push("high-protein");
  const cuisine = (r.cuisine || "").trim();
  const cost = Math.max(0.4, Math.min(12, num(r.costPerServing, 3)));
  costs[r.id] = Math.round(cost * 100) / 100;
  photos[r.id] = images[r.id];
  ai++;
  out.push({
    id: r.id, name: r.name,
    description: `${cuisine ? cuisine + " " : ""}${mealType} — a popular dish you can make at home.`,
    mealType, servings: Math.max(1, Math.min(6, Math.round(num(r.servings, 4)))), ingredients: ings, steps,
    totalTimeMinutes: Math.max(5, Math.min(120, Math.round(num(r.totalTimeMinutes, 15 + steps.length * 5)))),
    difficulty, equipment, dietTags: diet,
    cheapTips: (Array.isArray(r.cheapTips) ? r.cheapTips : []).slice(0, 2),
    substitutions: [], estimatedNutrition: nutrition,
    emoji: (r.emoji && [...r.emoji][0]) || EMOJI_FALLBACK[mealType] || "🍽️",
    accentColor: ACCENTS[idx % ACCENTS.length],
    ...(cuisine ? { cuisine } : {}),
    tags: [cuisine.toLowerCase(), mealType, ...diet].filter(Boolean).slice(0, 5),
  });
});

const cals = out.map((r) => r.estimatedNutrition.calories).sort((a, b) => a - b);
const cs = Object.values(costs).sort((a, b) => a - b);
console.log("PHASE 2: built", out.length, "recipes |", genIngredients.length, "new ingredients");
console.log("  calories/serving — min", cals[0], "median", cals[Math.floor(cals.length / 2)], "max", cals[cals.length - 1]);
console.log("  cost/serving — min $" + cs[0]?.toFixed(2), "median $" + cs[Math.floor(cs.length / 2)]?.toFixed(2), "max $" + cs[cs.length - 1]?.toFixed(2));

fs.writeFileSync("src/data/genRecipes.ts",
  'import type { Recipe } from "@/lib/types";\n\n// AI-authored recipes for famous, recognizable world dishes the catalog was\n// missing. Each has a REAL photo sourced from the open web (validated) — see\n// macroRecipePhotos.ts. Ingredients mapped to the catalog where possible (new\n// ones in genIngredients.ts). Per-serving macros + cost are AI-estimated and\n// trusted by the engines (id prefix `gen-`), like the TheMealDB imports.\nexport const GEN_RECIPES: Recipe[] = ' + JSON.stringify(out) +
  ";\n\n// AI-estimated realistic $/serving — trusted by calculateCostPerServing for gen- ids.\nexport const GEN_RECIPE_COSTS: Record<string, number> = " + JSON.stringify(costs) + ";\n");

const wIngs = genIngredients;
const wNut: Record<string, any> = {};
for (const g of genIngredients) wNut[g.id] = nutById[g.id];
fs.writeFileSync("src/data/genIngredients.ts",
  'import type { Ingredient } from "@/lib/types";\nimport type { NutritionPerUnit } from "@/data/ingredientNutrition";\n\n// New catalog ingredients introduced by the AI-authored GEN_RECIPES.\nexport const GEN_INGREDIENTS: Ingredient[] = ' + JSON.stringify(wIngs) +
  ";\n\nexport const GEN_INGREDIENT_NUTRITION: Record<string, NutritionPerUnit> = " + JSON.stringify(wNut) + ";\n");

fs.writeFileSync("/tmp/gen-photos.json", JSON.stringify(photos));
console.log("wrote src/data/genRecipes.ts + genIngredients.ts + /tmp/gen-photos.json");
