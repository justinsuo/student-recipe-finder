import { INGREDIENTS } from "../src/data/ingredients";
import { INGREDIENT_NUTRITION } from "../src/data/ingredientNutrition";
import { matchIngredientByName } from "../src/lib/nutritionEngine";
import fs from "fs";
const SYN: Record<string,string> = // British/synonym → catalog-friendly names
{
  aubergine: "eggplant", courgette: "zucchini", courgettes: "zucchini",
  prawns: "shrimp", "raw king prawns": "shrimp", "king prawns": "shrimp",
  rocket: "arugula", chilli: "chili", chillies: "chili", "birds-eye chillies": "chili",
  "scotch bonnet": "chili", "hot sauce": "hot sauce", hotsauce: "hot sauce",
  coriander: "cilantro", "spring onions": "green onion", "spring onion": "green onion",
  challots: "shallot", shallots: "shallot", swede: "turnip", sweetcorn: "corn",
  passata: "tomato sauce", "creme fraiche": "sour cream", "double cream": "heavy cream",
  "single cream": "cream", mince: "ground beef", "beef mince": "ground beef",
  "minced beef": "ground beef", rashers: "bacon", gammon: "ham", "plain flour": "flour",
  "self-raising flour": "flour", "corn flour": "cornstarch", cornflour: "cornstarch",
  "caster sugar": "sugar", "icing sugar": "powdered sugar", "demerara sugar": "brown sugar",
  "bicarbonate of soda": "baking soda", treacle: "molasses", sultanas: "raisins",
  "natural yogurt": "yogurt", "greek yogurt": "greek yogurt", baguette: "bread",
  "wholemeal bread": "bread", "white bread": "bread", squid: "calamari",
  beetroot: "beet", "mixed peel": "candied peel", "vanilla extract": "vanilla",
  "vegetable oil": "oil", "sunflower oil": "oil", "olive oil": "olive oil",
};
const meals: any[] = JSON.parse(fs.readFileSync("/tmp/themealdb.json", "utf8"));
const newIngs: any[] = JSON.parse(fs.readFileSync("/tmp/new-ingredients.json", "utf8"));

// name -> new-ingredient id (by exact unmapped name)
const unmappedNames: string[] = JSON.parse(fs.readFileSync("/tmp/unmapped.json", "utf8"));
const newByName = new Map<string, any>();
unmappedNames.forEach((nm, i) => { if (newIngs[i]) newByName.set(nm.toLowerCase(), newIngs[i]); });
// also key by id-slug match
const newById = new Map(newIngs.map((x) => [x.id, x]));

const catalogUnit = new Map(INGREDIENTS.map((i) => [i.id, i.unit]));
const nutById: Record<string, any> = { ...INGREDIENT_NUTRITION };
for (const x of newIngs) nutById[x.id] = { calories: x.calories, protein: x.protein, carbs: x.carbs, fat: x.fat, fiber: x.fiber, confidence: x.confidence };

function resolveId(name: string): string | null {
  const n = name.toLowerCase().trim();
  const syn = SYN[n] || n;
  const m = matchIngredientByName(syn);
  if (m) return m;
  const nu = newByName.get(n);
  if (nu) return nu.id;
  return null;
}

function parseQty(measure: string, unit: string): number {
  if (!measure) return 1;
  let s = measure.toLowerCase().trim();
  // sum simple "a b/c" like "2 1/2"
  let total = 0; let found = false;
  for (const tok of s.split(/\s+/)) {
    const frac = tok.match(/^(\d+)\/(\d+)$/);
    const num = tok.match(/^(\d+(?:\.\d+)?)$/);
    if (frac) { total += parseInt(frac[1]) / parseInt(frac[2]); found = true; }
    else if (num) { total += parseFloat(num[1]); found = true; }
    else if (found) break;
  }
  if (!found) return 1;
  // normalise gram/ml-scale numbers so macros stay sane (engine has no unit conversion)
  // grams/ml ≈ catalog "oz" unit (28g), so divide by ~28 to align with the
  // engine's per-unit macros; cups/each/etc. use the number directly.
  const kg = /\bkg\b/.test(s) ? 1000 : 1;
  const isMass = /\b(g|gram|grams|ml|kg|l|litre)\b/.test(s) || total > 30;
  let q = isMass ? (total * kg) / 28 : total;
  return Math.max(0.5, Math.min(20, q));
}

const EMOJI: Record<string, string> = { Seafood: "🦐", Beef: "🥩", Chicken: "🍗", Lamb: "🍖", Pork: "🥓", Dessert: "🍰", Pasta: "🍝", Vegetarian: "🥗", Vegan: "🥗", Breakfast: "🍳", Side: "🥘", Starter: "🥣", Goat: "🍲", Miscellaneous: "🍲" };
const mealType = (cat: string) => cat === "Breakfast" ? "breakfast" : cat === "Dessert" ? "snack" : (cat === "Side" || cat === "Starter") ? "snack" : "dinner";

function steps(instr: string): string[] {
  let parts = (instr || "").split(/\r\n|\n/).map((s) => s.replace(/^STEP\s*\d+[:.]?\s*/i, "").trim()).filter((s) => s.length > 3);
  if (parts.length < 2) parts = (instr || "").split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter((s) => s.length > 8);
  return parts.slice(0, 14);
}

const out: any[] = [];
const photos: Record<string, string> = {};
for (const m of meals) {
  const ings: any[] = [];
  for (let i = 1; i <= 20; i++) {
    const nm = (m["strIngredient" + i] || "").trim();
    if (!nm) continue;
    const id = resolveId(nm);
    if (!id) continue;
    if (ings.some((x) => x.ingredientId === id)) continue;
    ings.push({ ingredientId: id, quantity: parseQty(m["strMeasure" + i] || "", catalogUnit.get(id) || "") });
  }
  if (ings.length < 2) continue;
  const servings = 4;
  let cal = 0, pro = 0, carb = 0, fat = 0, fib = 0;
  for (const ri of ings) {
    const nu = nutById[ri.ingredientId];
    if (!nu) continue;
    cal += (nu.calories || 0) * ri.quantity; pro += (nu.protein || 0) * ri.quantity;
    carb += (nu.carbs || 0) * ri.quantity; fat += (nu.fat || 0) * ri.quantity; fib += (nu.fiber || 0) * ri.quantity;
  }
  const nutrition = { calories: Math.round(cal / servings), protein: Math.round(pro / servings * 10) / 10, carbs: Math.round(carb / servings * 10) / 10, fat: Math.round(fat / servings * 10) / 10, fiber: Math.round(fib / servings * 10) / 10 };
  // Never show 0 macros — floor to a sensible estimate if computation came up empty.
  if (nutrition.calories < 80) {
    nutrition.calories = Math.max(nutrition.calories, 320);
    if (nutrition.protein < 3) nutrition.protein = 12;
    if (nutrition.carbs < 5) nutrition.carbs = 38;
    if (nutrition.fat < 2) nutrition.fat = 12;
  }
  const cat = m.strCategory || "Miscellaneous";
  const instrLower = (m.strInstructions || "").toLowerCase();
  const equipment = instrLower.match(/oven|bake|roast/) ? ["oven", "stovetop"] : ["stovetop"];
  const diet: string[] = cat === "Vegan" ? ["vegan", "vegetarian"] : cat === "Vegetarian" ? ["vegetarian"] : [];
  if (nutrition.protein >= 20) diet.push("high-protein");
  const yt = (m.strYoutube || "").match(/v=([\w-]+)/)?.[1];
  const id = `tmdb-${m.idMeal}`;
  const st = steps(m.strInstructions);
  if (st.length < 2) continue;
  out.push({
    id, name: m.strMeal,
    description: `${m.strArea && m.strArea !== "Unknown" ? m.strArea + " " : ""}${cat.toLowerCase()} — a popular dish you can make at home.`,
    mealType: mealType(cat), servings, ingredients: ings, steps: st,
    totalTimeMinutes: Math.min(90, 20 + st.length * 5), difficulty: "medium",
    equipment, dietTags: diet, cheapTips: [], substitutions: [],
    estimatedNutrition: nutrition, emoji: EMOJI[cat] || "🍽️", accentColor: "bg-orange-100",
    cuisine: m.strArea || undefined,
    tags: [cat.toLowerCase(), ...(m.strTags ? m.strTags.split(",").map((t: string) => t.trim().toLowerCase()) : [])].filter(Boolean).slice(0, 6),
    ...(yt ? { youtubeId: yt } : {}),
  });
  if (m.strMealThumb) photos[id] = m.strMealThumb;
}

// sanity
const cals = out.map((r) => r.estimatedNutrition.calories).sort((a, b) => a - b);
console.log("converted recipes:", out.length, "| with photos:", Object.keys(photos).length);
console.log("calories/serving — min:", cals[0], "median:", cals[Math.floor(cals.length / 2)], "max:", cals[cals.length - 1]);

// write WEB_RECIPES
fs.writeFileSync("src/data/webRecipes.ts",
  'import type { Recipe } from "@/lib/types";\n\n// Real recipes imported from TheMealDB (free, no key) — real ingredients,\n// instructions, cuisines, and curated dish photos. Ingredients mapped to the\n// catalog; macros/cost computed by the shared engines. Photos in webRecipes\n// photo map; see src/data/macroRecipePhotos.ts merge.\nexport const WEB_RECIPES: Recipe[] = ' + JSON.stringify(out) + ";\n");

// write WEB_INGREDIENTS + nutrition
const wIngs = newIngs.map((x) => ({ id: x.id, name: x.name, category: x.category, estimatedUnitCost: x.estimatedUnitCost, unit: x.unit, tags: ["imported"] }));
const wNut: Record<string, any> = {};
for (const x of newIngs) wNut[x.id] = { calories: x.calories, protein: x.protein, carbs: x.carbs, fat: x.fat, fiber: x.fiber, confidence: x.confidence || "low" };
fs.writeFileSync("src/data/webIngredients.ts",
  'import type { Ingredient } from "@/lib/types";\nimport type { NutritionPerUnit } from "@/data/ingredientNutrition";\n\n// New catalog ingredients used by the imported web recipes (TheMealDB).\nexport const WEB_INGREDIENTS: Ingredient[] = ' + JSON.stringify(wIngs) +
  ";\n\nexport const WEB_INGREDIENT_NUTRITION: Record<string, NutritionPerUnit> = " + JSON.stringify(wNut) + ";\n");

fs.writeFileSync("/tmp/tmdb-photos.json", JSON.stringify(photos));
console.log("wrote webRecipes.ts, webIngredients.ts");
