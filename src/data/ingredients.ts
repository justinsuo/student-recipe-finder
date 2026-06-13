import type { Ingredient } from "@/lib/types";
import { WEB_INGREDIENTS } from "@/data/webIngredients";

// Prices are 2026 US grocery estimates (mid-tier chain — Kroger/Safeway/Aldi
// blend) per the listed unit. Each row's `estimatedUnitCost` is computed
// directly from `commonPackageSize` so the per-unit math is consistent:
//   estimatedUnitCost ≈ package_price / yield_in_the_listed_unit.
// Eggs/dairy/meat reflect post-2024 inflation (bird flu, beef shortage).
// Pantry staples (rice, beans, flour) are still in the $0.05–$0.20 per
// serving range. Spices/oils/sauces are *prorated* per tsp/tbsp based on
// total yield from the package, not guessed.
export const INGREDIENTS: Ingredient[] = [
  // ===== Grains / starches =====
  // 5 lb dry rice = ~11 cups dry = ~33 cups cooked. $5 / 33 ≈ $0.15/cup cooked.
  { id: "rice", name: "Rice", category: "grain", estimatedUnitCost: 0.15, unit: "cup", commonPackageSize: "5 lb bag (~$5)", shelfLifeDays: 365, tags: ["staple", "cheap"] },
  // 1 lb pasta box yields ~4 servings. $1.50/4 = $0.38.
  { id: "pasta", name: "Pasta", category: "grain", estimatedUnitCost: 0.38, unit: "serving", commonPackageSize: "1 lb box (~$1.50)", shelfLifeDays: 365, tags: ["staple", "cheap"] },
  { id: "ramen", name: "Instant ramen", category: "grain", estimatedUnitCost: 0.55, unit: "pack", commonPackageSize: "pack (~$0.55)", shelfLifeDays: 365, tags: ["staple"] },
  // Loaf ~$3.50, ~20 slices = $0.18.
  { id: "bread", name: "Bread", category: "grain", estimatedUnitCost: 0.18, unit: "slice", commonPackageSize: "loaf (~$3.50)", shelfLifeDays: 7, tags: ["staple"] },
  { id: "tortilla", name: "Tortilla", category: "grain", estimatedUnitCost: 0.25, unit: "tortilla", commonPackageSize: "10 ct (~$2.50)", shelfLifeDays: 14 },
  // 42 oz oats $4.50 = $0.107/oz. 1 cup oats = 80g ≈ 2.82 oz → $0.30/cup.
  { id: "oats", name: "Rolled oats", category: "grain", estimatedUnitCost: 0.30, unit: "cup", commonPackageSize: "42 oz (~$4.50)", shelfLifeDays: 365, tags: ["staple", "cheap"] },
  // Bag $3.50, ~10 servings.
  { id: "tortilla-chips", name: "Tortilla chips", category: "grain", estimatedUnitCost: 0.35, unit: "serving", commonPackageSize: "bag (~$3.50)", shelfLifeDays: 60 },

  // ===== Proteins =====
  // Dozen eggs ~$5.00 (post-bird-flu 2026). $5/12 = $0.42.
  { id: "eggs", name: "Eggs", category: "protein", estimatedUnitCost: 0.42, unit: "egg", commonPackageSize: "dozen (~$5)", shelfLifeDays: 28, tags: ["staple", "cheap", "high-protein"] },
  // Chicken breast ~$5.50/lb, 4 servings/lb.
  { id: "chicken-breast", name: "Chicken breast", category: "protein", estimatedUnitCost: 1.40, unit: "serving", commonPackageSize: "1 lb (~$5.50)", shelfLifeDays: 3, tags: ["high-protein"] },
  // 80/20 ground beef $6.50/lb, 4 servings/lb.
  { id: "ground-beef", name: "Ground beef", category: "protein", estimatedUnitCost: 1.65, unit: "serving", commonPackageSize: "1 lb (~$6.50)", shelfLifeDays: 3, tags: ["high-protein"] },
  // 14 oz tofu block ~$2.75, 3 servings/block.
  { id: "tofu", name: "Tofu", category: "protein", estimatedUnitCost: 0.92, unit: "serving", commonPackageSize: "14 oz (~$2.75)", shelfLifeDays: 7, tags: ["vegan", "high-protein"] },
  // 16 oz peanut butter ~$3.50, ~30 tbsp/jar → $0.12/tbsp.
  { id: "peanut-butter", name: "Peanut butter", category: "protein", estimatedUnitCost: 0.12, unit: "tbsp", commonPackageSize: "16 oz jar (~$3.50)", shelfLifeDays: 180, tags: ["staple", "high-protein"] },
  // 32 oz Greek yogurt $5.50 = 4 cups → $1.38/cup.
  { id: "greek-yogurt", name: "Greek yogurt", category: "dairy", estimatedUnitCost: 1.38, unit: "cup", commonPackageSize: "32 oz tub (~$5.50)", shelfLifeDays: 14, tags: ["high-protein"] },
  // 1 lb lentils ~$2 = ~2.3 cups-dry → $0.85/cup-dry.
  { id: "lentils", name: "Lentils", category: "grain", estimatedUnitCost: 0.85, unit: "cup-dry", commonPackageSize: "1 lb bag (~$2)", shelfLifeDays: 365, tags: ["staple", "cheap", "vegan"] },
  { id: "chickpeas", name: "Chickpeas (canned)", category: "canned", estimatedUnitCost: 1.10, unit: "can", commonPackageSize: "15 oz can (~$1.10)", shelfLifeDays: 730, tags: ["staple", "vegan"] },
  { id: "black-beans", name: "Black beans (canned)", category: "canned", estimatedUnitCost: 1.10, unit: "can", commonPackageSize: "15 oz can (~$1.10)", shelfLifeDays: 730, tags: ["staple", "vegan"] },
  // 5 oz tuna can ~$1.40 in 2026 (Chicken of the Sea / StarKist).
  { id: "tuna", name: "Canned tuna", category: "canned", estimatedUnitCost: 1.40, unit: "can", commonPackageSize: "5 oz can (~$1.40)", shelfLifeDays: 730, tags: ["high-protein", "staple"] },

  // ===== Vegetables =====
  // 3 lb yellow onion bag $3.50 → ~6 onions → $0.58/onion.
  { id: "onion", name: "Onion", category: "vegetable", estimatedUnitCost: 0.55, unit: "onion", commonPackageSize: "3 lb bag (~$3.50)", shelfLifeDays: 30, tags: ["staple"] },
  // Head garlic $1, ~10 cloves.
  { id: "garlic", name: "Garlic", category: "vegetable", estimatedUnitCost: 0.10, unit: "clove", commonPackageSize: "head (~$1)", shelfLifeDays: 60, tags: ["staple"] },
  // 5 lb russet bag $4.50, ~10 potatoes.
  { id: "potato", name: "Potato", category: "vegetable", estimatedUnitCost: 0.45, unit: "potato", commonPackageSize: "5 lb bag (~$4.50)", shelfLifeDays: 30, tags: ["staple", "cheap"] },
  // 2 lb carrot bag $2, ~10 carrots.
  { id: "carrot", name: "Carrot", category: "vegetable", estimatedUnitCost: 0.20, unit: "carrot", commonPackageSize: "2 lb bag (~$2)", shelfLifeDays: 30 },
  // 5 oz baby spinach bag $3.50 yields ~5 packed cups → $0.70/cup.
  { id: "spinach", name: "Spinach", category: "vegetable", estimatedUnitCost: 0.70, unit: "cup", commonPackageSize: "5 oz bag (~$3.50)", shelfLifeDays: 5 },
  { id: "tomato", name: "Tomato", category: "vegetable", estimatedUnitCost: 0.75, unit: "tomato", commonPackageSize: "single (~$0.75)", shelfLifeDays: 7 },
  { id: "bell-pepper", name: "Bell pepper", category: "vegetable", estimatedUnitCost: 1.25, unit: "pepper", commonPackageSize: "single (~$1.25)", shelfLifeDays: 7 },
  // Head broccoli ~$2.50 yields ~4 cups florets.
  { id: "broccoli", name: "Broccoli", category: "vegetable", estimatedUnitCost: 0.65, unit: "cup", commonPackageSize: "head (~$2.50)", shelfLifeDays: 7 },
  // Bunch scallions $1.25, ~6 stalks.
  { id: "scallion", name: "Scallion", category: "vegetable", estimatedUnitCost: 0.20, unit: "stalk", commonPackageSize: "bunch (~$1.25)", shelfLifeDays: 7 },
  // 16 oz frozen mixed veg $2.50, ~4 cups.
  { id: "frozen-veg", name: "Frozen mixed vegetables", category: "frozen", estimatedUnitCost: 0.62, unit: "cup", commonPackageSize: "16 oz bag (~$2.50)", shelfLifeDays: 180, tags: ["cheap", "staple"] },
  { id: "frozen-corn", name: "Frozen corn", category: "frozen", estimatedUnitCost: 0.60, unit: "cup", commonPackageSize: "16 oz bag (~$2.40)", shelfLifeDays: 180 },

  // ===== Fruit =====
  { id: "banana", name: "Banana", category: "fruit", estimatedUnitCost: 0.30, unit: "banana", commonPackageSize: "single (~$0.30)", shelfLifeDays: 5, tags: ["staple", "cheap"] },
  { id: "apple", name: "Apple", category: "fruit", estimatedUnitCost: 0.85, unit: "apple", commonPackageSize: "single (~$0.85)", shelfLifeDays: 14 },
  { id: "lemon", name: "Lemon", category: "fruit", estimatedUnitCost: 0.70, unit: "lemon", commonPackageSize: "single (~$0.70)", shelfLifeDays: 14 },
  // 12 oz frozen berries $4, ~2.5 cups.
  { id: "frozen-berries", name: "Frozen berries", category: "frozen", estimatedUnitCost: 1.60, unit: "cup", commonPackageSize: "12 oz bag (~$4)", shelfLifeDays: 180 },

  // ===== Dairy =====
  // 8 oz shredded cheese bag $3.50 = ~2 cups → $0.44 per 1/4 cup.
  { id: "cheese", name: "Shredded cheese", category: "dairy", estimatedUnitCost: 0.44, unit: "1/4 cup", commonPackageSize: "8 oz bag (~$3.50)", shelfLifeDays: 21 },
  // Gallon milk $4.50 = 16 cups → $0.28/cup.
  { id: "milk", name: "Milk", category: "dairy", estimatedUnitCost: 0.28, unit: "cup", commonPackageSize: "gallon (~$4.50)", shelfLifeDays: 14 },
  // 1 lb (4 sticks) butter $6 = 32 tbsp → $0.19/tbsp.
  { id: "butter", name: "Butter", category: "dairy", estimatedUnitCost: 0.19, unit: "tbsp", commonPackageSize: "1 lb / 4 sticks (~$6)", shelfLifeDays: 60 },

  // ===== Canned pantry =====
  // 15 oz tomato sauce can $1 = ~1.75 cups.
  { id: "tomato-sauce", name: "Tomato sauce", category: "canned", estimatedUnitCost: 0.60, unit: "cup", commonPackageSize: "15 oz can (~$1)", shelfLifeDays: 730, tags: ["staple"] },
  { id: "crushed-tomato", name: "Crushed tomatoes", category: "canned", estimatedUnitCost: 2.00, unit: "can", commonPackageSize: "28 oz can (~$2)", shelfLifeDays: 730 },
  // 6 oz pesto jar $4.50, ~12 tbsp.
  { id: "pesto", name: "Pesto", category: "condiment", estimatedUnitCost: 0.38, unit: "tbsp", commonPackageSize: "6 oz jar (~$4.50)", shelfLifeDays: 30 },
  { id: "coconut-milk", name: "Coconut milk", category: "canned", estimatedUnitCost: 2.20, unit: "can", commonPackageSize: "13.5 oz can (~$2.20)", shelfLifeDays: 730 },

  // ===== Condiments / oils =====
  // 10 oz soy sauce $3.50 = ~20 tbsp → $0.18/tbsp.
  { id: "soy-sauce", name: "Soy sauce", category: "condiment", estimatedUnitCost: 0.18, unit: "tbsp", commonPackageSize: "10 oz bottle (~$3.50)", shelfLifeDays: 365, tags: ["staple"] },
  // 17 oz olive oil $9 = ~34 tbsp → $0.27/tbsp.
  { id: "olive-oil", name: "Olive oil", category: "condiment", estimatedUnitCost: 0.27, unit: "tbsp", commonPackageSize: "17 oz (~$9)", shelfLifeDays: 365, tags: ["staple"] },
  // 48 oz veg oil $5 = ~96 tbsp → $0.05/tbsp.
  { id: "vegetable-oil", name: "Vegetable oil", category: "condiment", estimatedUnitCost: 0.05, unit: "tbsp", commonPackageSize: "48 oz (~$5)", shelfLifeDays: 365, tags: ["staple"] },
  // 12 oz honey $5.50 = ~16 tbsp → $0.34/tbsp.
  { id: "honey", name: "Honey", category: "condiment", estimatedUnitCost: 0.34, unit: "tbsp", commonPackageSize: "12 oz (~$5.50)", shelfLifeDays: 365 },
  // 30 oz mayo $5 = ~60 tbsp → $0.08/tbsp.
  { id: "mayonnaise", name: "Mayonnaise", category: "condiment", estimatedUnitCost: 0.08, unit: "tbsp", commonPackageSize: "30 oz (~$5)", shelfLifeDays: 90 },
  // 17 oz sriracha $5 = ~100 tsp → $0.05/tsp.
  { id: "sriracha", name: "Sriracha", category: "condiment", estimatedUnitCost: 0.05, unit: "tsp", commonPackageSize: "17 oz (~$5)", shelfLifeDays: 365 },

  // ===== Spices / baking =====
  // 26 oz salt $1.50 = ~150 tsp → $0.01/tsp.
  { id: "salt", name: "Salt", category: "spice", estimatedUnitCost: 0.01, unit: "tsp", commonPackageSize: "26 oz (~$1.50)", shelfLifeDays: 3650, tags: ["staple"] },
  // 3 oz pepper $3.50 = ~18 tsp → $0.19/tsp.
  { id: "pepper", name: "Black pepper", category: "spice", estimatedUnitCost: 0.19, unit: "tsp", commonPackageSize: "3 oz (~$3.50)", shelfLifeDays: 730, tags: ["staple"] },
  // 3 oz chili powder $3 = ~18 tsp.
  { id: "chili-powder", name: "Chili powder", category: "spice", estimatedUnitCost: 0.17, unit: "tsp", commonPackageSize: "3 oz (~$3)", shelfLifeDays: 730 },
  // 1.5 oz cumin $3.50 = ~9 tsp.
  { id: "cumin", name: "Cumin", category: "spice", estimatedUnitCost: 0.39, unit: "tsp", commonPackageSize: "1.5 oz (~$3.50)", shelfLifeDays: 730 },
  // 1.6 oz curry $3 = ~10 tsp.
  { id: "curry-powder", name: "Curry powder", category: "spice", estimatedUnitCost: 0.30, unit: "tsp", commonPackageSize: "1.6 oz (~$3)", shelfLifeDays: 730 },
  // 2 oz paprika $3 = ~12 tsp.
  { id: "paprika", name: "Paprika", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "2 oz (~$3)", shelfLifeDays: 730 },
  // 1 oz Italian seasoning $3 = ~6 tsp.
  { id: "italian-seasoning", name: "Italian seasoning", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  { id: "ginger", name: "Fresh ginger", category: "spice", estimatedUnitCost: 0.10, unit: "tsp", commonPackageSize: "small piece (~$1)", shelfLifeDays: 21 },

  // ===== Snacks / misc =====
  // 16 oz salsa jar $3.50, ~8 servings of 1/4 cup.
  { id: "salsa", name: "Salsa", category: "condiment", estimatedUnitCost: 0.44, unit: "1/4 cup", commonPackageSize: "16 oz jar (~$3.50)", shelfLifeDays: 30 },
  // 6 oz feta $4.50, ~6 servings of 1/4 cup.
  { id: "feta", name: "Feta cheese", category: "dairy", estimatedUnitCost: 0.75, unit: "1/4 cup", commonPackageSize: "6 oz (~$4.50)", shelfLifeDays: 30 },

  // ===== Expanded grains / starches =====
  // 16 oz quinoa $5.50, ~2.3 cups-dry.
  { id: "quinoa", name: "Quinoa", category: "grain", estimatedUnitCost: 2.40, unit: "cup-dry", commonPackageSize: "16 oz (~$5.50)", shelfLifeDays: 365, tags: ["high-protein", "gluten-free"] },
  // 12 oz couscous $3 = ~2 cups-dry.
  { id: "couscous", name: "Couscous", category: "grain", estimatedUnitCost: 1.50, unit: "cup-dry", commonPackageSize: "12 oz (~$3)", shelfLifeDays: 365 },
  // 2 lb brown rice $3.50 = ~4.5 cups dry → ~13 cups cooked → $0.27/cup cooked.
  { id: "brown-rice", name: "Brown rice", category: "grain", estimatedUnitCost: 0.27, unit: "cup", commonPackageSize: "2 lb (~$3.50)", shelfLifeDays: 180 },
  { id: "bagel", name: "Bagel", category: "grain", estimatedUnitCost: 0.83, unit: "bagel", commonPackageSize: "6 ct (~$5)", shelfLifeDays: 7 },
  { id: "english-muffin", name: "English muffin", category: "grain", estimatedUnitCost: 0.58, unit: "muffin", commonPackageSize: "6 ct (~$3.50)", shelfLifeDays: 14 },
  { id: "pita", name: "Pita bread", category: "grain", estimatedUnitCost: 0.50, unit: "pita", commonPackageSize: "6 ct (~$3)", shelfLifeDays: 14 },
  // 5 lb flour $4 = ~17 cups.
  { id: "flour", name: "All-purpose flour", category: "grain", estimatedUnitCost: 0.24, unit: "cup", commonPackageSize: "5 lb (~$4)", shelfLifeDays: 365, tags: ["staple", "baking"] },
  { id: "rolled-oats-instant", name: "Instant oat packets", category: "grain", estimatedUnitCost: 0.50, unit: "pack", commonPackageSize: "10 ct (~$5)", shelfLifeDays: 365 },
  // 14 oz rice noodles $3.50, ~4 servings.
  { id: "rice-noodles", name: "Rice noodles", category: "grain", estimatedUnitCost: 0.88, unit: "serving", commonPackageSize: "14 oz (~$3.50)", shelfLifeDays: 365, tags: ["gluten-free"] },
  // 8 oz soba $4.50, ~3 servings.
  { id: "soba-noodles", name: "Soba noodles", category: "grain", estimatedUnitCost: 1.50, unit: "serving", commonPackageSize: "8 oz (~$4.50)", shelfLifeDays: 365 },

  // ===== Expanded proteins =====
  // 1.5 lb thighs $6, ~5 servings.
  { id: "chicken-thighs", name: "Chicken thighs", category: "protein", estimatedUnitCost: 1.20, unit: "serving", commonPackageSize: "1.5 lb (~$6)", shelfLifeDays: 3, tags: ["high-protein"] },
  // 1 lb ground turkey $5.50, ~4 servings.
  { id: "ground-turkey", name: "Ground turkey", category: "protein", estimatedUnitCost: 1.40, unit: "serving", commonPackageSize: "1 lb (~$5.50)", shelfLifeDays: 3, tags: ["high-protein"] },
  // 1 lb salmon $12 (2026), ~3 servings.
  { id: "salmon", name: "Salmon fillet", category: "protein", estimatedUnitCost: 4.00, unit: "serving", commonPackageSize: "1 lb (~$12)", shelfLifeDays: 2, tags: ["high-protein"] },
  // 1 lb frozen shrimp $11, ~4 servings.
  { id: "shrimp", name: "Shrimp (frozen)", category: "frozen", estimatedUnitCost: 2.75, unit: "serving", commonPackageSize: "1 lb (~$11)", shelfLifeDays: 365, tags: ["high-protein"] },
  // 12 oz bacon $7 = ~12 slices.
  { id: "bacon", name: "Bacon", category: "protein", estimatedUnitCost: 0.58, unit: "slice", commonPackageSize: "12 oz (~$7)", shelfLifeDays: 14 },
  // 1 lb sausage $5.50, ~4 servings.
  { id: "sausage", name: "Pork sausage", category: "protein", estimatedUnitCost: 1.40, unit: "serving", commonPackageSize: "1 lb (~$5.50)", shelfLifeDays: 7 },
  { id: "hot-dog", name: "Hot dog", category: "protein", estimatedUnitCost: 0.60, unit: "dog", commonPackageSize: "8 ct (~$4.50)", shelfLifeDays: 14 },
  // 9 oz deli turkey $5.50, ~5 servings.
  { id: "deli-turkey", name: "Deli turkey", category: "protein", estimatedUnitCost: 1.10, unit: "serving", commonPackageSize: "9 oz (~$5.50)", shelfLifeDays: 7, tags: ["high-protein"] },
  // 8 oz tempeh $4, ~3 servings.
  { id: "tempeh", name: "Tempeh", category: "protein", estimatedUnitCost: 1.35, unit: "serving", commonPackageSize: "8 oz (~$4)", shelfLifeDays: 14, tags: ["vegan", "high-protein"] },
  // 12 oz edamame $3, ~2.5 cups shelled.
  { id: "edamame", name: "Edamame", category: "frozen", estimatedUnitCost: 1.20, unit: "cup", commonPackageSize: "12 oz bag (~$3)", shelfLifeDays: 180, tags: ["vegan", "high-protein"] },
  { id: "white-beans", name: "White beans (canned)", category: "canned", estimatedUnitCost: 1.10, unit: "can", commonPackageSize: "15 oz can (~$1.10)", shelfLifeDays: 730, tags: ["vegan"] },
  { id: "kidney-beans", name: "Kidney beans (canned)", category: "canned", estimatedUnitCost: 1.10, unit: "can", commonPackageSize: "15 oz can (~$1.10)", shelfLifeDays: 730, tags: ["vegan"] },
  { id: "refried-beans", name: "Refried beans", category: "canned", estimatedUnitCost: 1.30, unit: "can", commonPackageSize: "16 oz can (~$1.30)", shelfLifeDays: 730 },
  { id: "canned-chicken", name: "Canned chicken", category: "canned", estimatedUnitCost: 3.00, unit: "can", commonPackageSize: "12 oz can (~$3)", shelfLifeDays: 730, tags: ["high-protein"] },
  { id: "sardines", name: "Canned sardines", category: "canned", estimatedUnitCost: 2.00, unit: "can", commonPackageSize: "3.75 oz can (~$2)", shelfLifeDays: 730, tags: ["high-protein"] },
  // 16 oz almonds $9, 1/4 cup = 1.25 oz → ~13 servings.
  { id: "almonds", name: "Almonds", category: "protein", estimatedUnitCost: 0.70, unit: "1/4 cup", commonPackageSize: "16 oz (~$9)", shelfLifeDays: 365 },
  { id: "walnuts", name: "Walnuts", category: "protein", estimatedUnitCost: 0.75, unit: "1/4 cup", commonPackageSize: "16 oz (~$10)", shelfLifeDays: 365 },
  { id: "cashews", name: "Cashews", category: "protein", estimatedUnitCost: 0.85, unit: "1/4 cup", commonPackageSize: "16 oz (~$11)", shelfLifeDays: 365 },
  // 2 lb protein powder $40, ~30 scoops.
  { id: "protein-powder", name: "Protein powder", category: "protein", estimatedUnitCost: 1.35, unit: "scoop", commonPackageSize: "2 lb tub (~$40)", shelfLifeDays: 730, tags: ["high-protein"] },

  // ===== Expanded vegetables =====
  // Bunch celery $3, ~8 stalks.
  { id: "celery", name: "Celery", category: "vegetable", estimatedUnitCost: 0.38, unit: "stalk", commonPackageSize: "bunch (~$3)", shelfLifeDays: 14 },
  { id: "cucumber", name: "Cucumber", category: "vegetable", estimatedUnitCost: 1.00, unit: "cucumber", commonPackageSize: "single (~$1)", shelfLifeDays: 7 },
  { id: "lettuce", name: "Lettuce", category: "vegetable", estimatedUnitCost: 2.50, unit: "head", commonPackageSize: "head (~$2.50)", shelfLifeDays: 10 },
  // Bunch kale $3, yields ~3 packed cups.
  { id: "kale", name: "Kale", category: "vegetable", estimatedUnitCost: 1.00, unit: "cup", commonPackageSize: "bunch (~$3)", shelfLifeDays: 7 },
  // Head cabbage $3 = ~8 cups shredded.
  { id: "cabbage", name: "Cabbage", category: "vegetable", estimatedUnitCost: 0.38, unit: "cup", commonPackageSize: "head (~$3)", shelfLifeDays: 30 },
  { id: "zucchini", name: "Zucchini", category: "vegetable", estimatedUnitCost: 1.10, unit: "zucchini", commonPackageSize: "single (~$1.10)", shelfLifeDays: 7 },
  // 8 oz mushrooms $3.50, ~3 cups sliced.
  { id: "mushroom", name: "Mushrooms", category: "vegetable", estimatedUnitCost: 1.20, unit: "cup", commonPackageSize: "8 oz (~$3.50)", shelfLifeDays: 7 },
  { id: "corn", name: "Fresh corn", category: "vegetable", estimatedUnitCost: 0.70, unit: "ear", commonPackageSize: "ear (~$0.70)", shelfLifeDays: 5 },
  { id: "sweet-potato", name: "Sweet potato", category: "vegetable", estimatedUnitCost: 1.20, unit: "potato", commonPackageSize: "single (~$1.20)", shelfLifeDays: 30 },
  { id: "jalapeno", name: "Jalapeño", category: "vegetable", estimatedUnitCost: 0.30, unit: "pepper", commonPackageSize: "single (~$0.30)", shelfLifeDays: 14 },
  { id: "avocado", name: "Avocado", category: "vegetable", estimatedUnitCost: 1.75, unit: "avocado", commonPackageSize: "single (~$1.75)", shelfLifeDays: 5 },
  { id: "frozen-spinach", name: "Frozen spinach", category: "frozen", estimatedUnitCost: 0.85, unit: "cup", commonPackageSize: "10 oz brick (~$2.50)", shelfLifeDays: 180 },
  // 12 oz frozen broccoli $2.50, ~4 cups.
  { id: "frozen-broccoli", name: "Frozen broccoli", category: "frozen", estimatedUnitCost: 0.62, unit: "cup", commonPackageSize: "12 oz (~$2.50)", shelfLifeDays: 180 },
  // 8 oz ginger paste tube $6, ~48 tsp.
  { id: "ginger-paste", name: "Ginger paste", category: "condiment", estimatedUnitCost: 0.12, unit: "tsp", commonPackageSize: "8 oz tube (~$6)", shelfLifeDays: 180 },

  // ===== Expanded fruit =====
  { id: "orange", name: "Orange", category: "fruit", estimatedUnitCost: 0.90, unit: "orange", commonPackageSize: "single (~$0.90)", shelfLifeDays: 14 },
  // 16 oz strawberries $5 = ~3.5 cups sliced.
  { id: "strawberries", name: "Strawberries", category: "fruit", estimatedUnitCost: 1.50, unit: "cup", commonPackageSize: "16 oz (~$5)", shelfLifeDays: 5 },
  { id: "blueberries", name: "Blueberries", category: "fruit", estimatedUnitCost: 3.00, unit: "cup", commonPackageSize: "6 oz (~$4)", shelfLifeDays: 7 },
  { id: "grapes", name: "Grapes", category: "fruit", estimatedUnitCost: 1.40, unit: "cup", commonPackageSize: "2 lb (~$6)", shelfLifeDays: 10 },
  { id: "raisins", name: "Raisins", category: "fruit", estimatedUnitCost: 0.50, unit: "1/4 cup", commonPackageSize: "1 lb (~$4.50)", shelfLifeDays: 365 },
  // 16 oz frozen mango $4, ~3 cups.
  { id: "frozen-mango", name: "Frozen mango", category: "frozen", estimatedUnitCost: 1.35, unit: "cup", commonPackageSize: "16 oz (~$4)", shelfLifeDays: 180 },

  // ===== Expanded dairy =====
  // 16 oz cottage cheese $4.50, ~4 servings of 1/2 cup.
  { id: "cottage-cheese", name: "Cottage cheese", category: "dairy", estimatedUnitCost: 1.10, unit: "1/2 cup", commonPackageSize: "16 oz (~$4.50)", shelfLifeDays: 14, tags: ["high-protein"] },
  // 8 oz cream cheese block $3.50 = ~16 tbsp.
  { id: "cream-cheese", name: "Cream cheese", category: "dairy", estimatedUnitCost: 0.22, unit: "tbsp", commonPackageSize: "8 oz (~$3.50)", shelfLifeDays: 30 },
  // 16 oz sour cream $3.50 = ~32 tbsp.
  { id: "sour-cream", name: "Sour cream", category: "dairy", estimatedUnitCost: 0.11, unit: "tbsp", commonPackageSize: "16 oz (~$3.50)", shelfLifeDays: 21 },
  // 8 oz parmesan grated $7, ~24 tbsp.
  { id: "parmesan", name: "Parmesan", category: "dairy", estimatedUnitCost: 0.30, unit: "tbsp", commonPackageSize: "8 oz (~$7)", shelfLifeDays: 60 },
  // 16 oz shredded mozzarella $6, ~4 cups → $0.38 per 1/4 cup.
  { id: "mozzarella", name: "Mozzarella", category: "dairy", estimatedUnitCost: 0.38, unit: "1/4 cup", commonPackageSize: "16 oz (~$6)", shelfLifeDays: 14 },
  // Half gallon almond milk $4.50 = 8 cups → $0.56/cup.
  { id: "almond-milk", name: "Almond milk", category: "dairy", estimatedUnitCost: 0.56, unit: "cup", commonPackageSize: "half gal (~$4.50)", shelfLifeDays: 14, tags: ["vegan", "dairy-free"] },
  { id: "oat-milk", name: "Oat milk", category: "dairy", estimatedUnitCost: 0.60, unit: "cup", commonPackageSize: "half gal (~$5)", shelfLifeDays: 14, tags: ["vegan", "dairy-free"] },

  // ===== Expanded condiments =====
  // 20 oz ketchup $3 = ~40 tbsp.
  { id: "ketchup", name: "Ketchup", category: "condiment", estimatedUnitCost: 0.08, unit: "tbsp", commonPackageSize: "20 oz (~$3)", shelfLifeDays: 365 },
  // 12 oz mustard $2.50 = ~72 tsp.
  { id: "mustard", name: "Mustard", category: "condiment", estimatedUnitCost: 0.04, unit: "tsp", commonPackageSize: "12 oz (~$2.50)", shelfLifeDays: 365 },
  // 18 oz BBQ sauce $3.50 = ~36 tbsp.
  { id: "bbq-sauce", name: "BBQ sauce", category: "condiment", estimatedUnitCost: 0.10, unit: "tbsp", commonPackageSize: "18 oz (~$3.50)", shelfLifeDays: 180 },
  // 16 oz ranch $4 = ~32 tbsp.
  { id: "ranch", name: "Ranch dressing", category: "condiment", estimatedUnitCost: 0.13, unit: "tbsp", commonPackageSize: "16 oz (~$4)", shelfLifeDays: 90 },
  // 16 oz vinegar $2.50 = ~32 tbsp.
  { id: "vinegar", name: "Vinegar", category: "condiment", estimatedUnitCost: 0.08, unit: "tbsp", commonPackageSize: "16 oz (~$2.50)", shelfLifeDays: 1095, tags: ["staple"] },
  // 12 oz rice vinegar $3.50 = ~24 tbsp.
  { id: "rice-vinegar", name: "Rice vinegar", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "12 oz (~$3.50)", shelfLifeDays: 1095 },
  // 10 oz sesame oil $9 = ~60 tsp.
  { id: "sesame-oil", name: "Sesame oil", category: "condiment", estimatedUnitCost: 0.15, unit: "tsp", commonPackageSize: "10 oz (~$9)", shelfLifeDays: 365 },
  // 9 oz hoisin $4.50 = ~18 tbsp.
  { id: "hoisin", name: "Hoisin sauce", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "9 oz (~$4.50)", shelfLifeDays: 365 },
  // 8 oz fish sauce $4 = ~48 tsp.
  { id: "fish-sauce", name: "Fish sauce", category: "condiment", estimatedUnitCost: 0.08, unit: "tsp", commonPackageSize: "8 oz (~$4)", shelfLifeDays: 1095 },
  // 16 oz miso $9 = ~32 tbsp.
  { id: "miso", name: "Miso paste", category: "condiment", estimatedUnitCost: 0.28, unit: "tbsp", commonPackageSize: "16 oz tub (~$9)", shelfLifeDays: 365 },
  // 16 oz tahini $9 = ~32 tbsp.
  { id: "tahini", name: "Tahini", category: "condiment", estimatedUnitCost: 0.28, unit: "tbsp", commonPackageSize: "16 oz (~$9)", shelfLifeDays: 365 },
  // 12 oz maple syrup $9 = ~24 tbsp.
  { id: "maple-syrup", name: "Maple syrup", category: "condiment", estimatedUnitCost: 0.38, unit: "tbsp", commonPackageSize: "12 oz (~$9)", shelfLifeDays: 365 },
  // 12 oz jam $4 = ~24 tbsp.
  { id: "jam", name: "Jam", category: "condiment", estimatedUnitCost: 0.17, unit: "tbsp", commonPackageSize: "12 oz (~$4)", shelfLifeDays: 365 },
  // 13 oz Nutella $5.50 = ~22 tbsp.
  { id: "nutella", name: "Nutella", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "13 oz (~$5.50)", shelfLifeDays: 365 },

  // ===== Expanded spices / baking =====
  // 4 lb sugar $3.50 = ~9 cups = ~144 tbsp.
  { id: "sugar", name: "Sugar", category: "spice", estimatedUnitCost: 0.02, unit: "tbsp", commonPackageSize: "4 lb (~$3.50)", shelfLifeDays: 3650, tags: ["staple", "baking"] },
  { id: "brown-sugar", name: "Brown sugar", category: "spice", estimatedUnitCost: 0.04, unit: "tbsp", commonPackageSize: "2 lb (~$3.50)", shelfLifeDays: 730 },
  // 4 oz vanilla extract $12 = ~24 tsp.
  { id: "vanilla", name: "Vanilla extract", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "4 oz (~$12)", shelfLifeDays: 1095 },
  // 1 lb baking soda $1 = ~96 tsp.
  { id: "baking-soda", name: "Baking soda", category: "spice", estimatedUnitCost: 0.01, unit: "tsp", commonPackageSize: "1 lb (~$1)", shelfLifeDays: 730 },
  // 10 oz baking powder $3 = ~60 tsp.
  { id: "baking-powder", name: "Baking powder", category: "spice", estimatedUnitCost: 0.05, unit: "tsp", commonPackageSize: "10 oz (~$3)", shelfLifeDays: 365 },
  // 8 oz cocoa $4.50 = ~36 tbsp.
  { id: "cocoa", name: "Cocoa powder", category: "spice", estimatedUnitCost: 0.13, unit: "tbsp", commonPackageSize: "8 oz (~$4.50)", shelfLifeDays: 730 },
  // 2 oz cinnamon $3.50 = ~12 tsp.
  { id: "cinnamon", name: "Cinnamon", category: "spice", estimatedUnitCost: 0.29, unit: "tsp", commonPackageSize: "2 oz (~$3.50)", shelfLifeDays: 730 },
  // 1 oz dried oregano $3 = ~6 tsp.
  { id: "oregano", name: "Oregano", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  // 1 oz dried thyme $3 = ~6 tsp.
  { id: "thyme", name: "Thyme", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  // 0.25 oz bay leaves $3 = ~30 leaves.
  { id: "bay-leaf", name: "Bay leaves", category: "spice", estimatedUnitCost: 0.10, unit: "leaf", commonPackageSize: "0.25 oz (~$3)", shelfLifeDays: 730 },
  // 1.5 oz red pepper flakes $3 = ~9 tsp.
  { id: "red-pepper-flakes", name: "Red pepper flakes", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  // 3 oz garlic powder $3.50 = ~18 tsp.
  { id: "garlic-powder", name: "Garlic powder", category: "spice", estimatedUnitCost: 0.20, unit: "tsp", commonPackageSize: "3 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "onion-powder", name: "Onion powder", category: "spice", estimatedUnitCost: 0.22, unit: "tsp", commonPackageSize: "2.6 oz (~$3.50)", shelfLifeDays: 730 },

  // ===== Expanded snacks / misc =====
  { id: "crackers", name: "Crackers", category: "snack", estimatedUnitCost: 0.35, unit: "serving", commonPackageSize: "13 oz (~$4)", shelfLifeDays: 90 },
  { id: "popcorn-kernels", name: "Popcorn kernels", category: "snack", estimatedUnitCost: 0.20, unit: "1/4 cup", commonPackageSize: "2 lb (~$4)", shelfLifeDays: 730 },
  { id: "chocolate", name: "Dark chocolate", category: "snack", estimatedUnitCost: 0.85, unit: "oz", commonPackageSize: "3 oz bar (~$2.50)", shelfLifeDays: 365 },
  { id: "granola-bar", name: "Granola bar", category: "snack", estimatedUnitCost: 0.75, unit: "bar", commonPackageSize: "8 ct (~$6)", shelfLifeDays: 180 },
  { id: "chips", name: "Potato chips", category: "snack", estimatedUnitCost: 0.50, unit: "serving", commonPackageSize: "10 oz (~$5)", shelfLifeDays: 60 },

  // ===== Extra ingredients for the expanded recipe set =====
  // 10 oz hummus $5, ~10 servings of 1/4 cup.
  { id: "hummus", name: "Hummus", category: "condiment", estimatedUnitCost: 0.50, unit: "1/4 cup", commonPackageSize: "10 oz (~$5)", shelfLifeDays: 14 },
  { id: "kimchi", name: "Kimchi", category: "vegetable", estimatedUnitCost: 0.85, unit: "1/4 cup", commonPackageSize: "16 oz (~$7)", shelfLifeDays: 60 },
  { id: "salsa-verde", name: "Salsa verde", category: "condiment", estimatedUnitCost: 0.45, unit: "1/4 cup", commonPackageSize: "16 oz (~$3.50)", shelfLifeDays: 30 },
  { id: "frozen-peas", name: "Frozen peas", category: "frozen", estimatedUnitCost: 0.62, unit: "cup", commonPackageSize: "16 oz (~$2.50)", shelfLifeDays: 180 },
  { id: "frozen-corn-kernels", name: "Frozen corn kernels", category: "frozen", estimatedUnitCost: 0.60, unit: "cup", commonPackageSize: "16 oz (~$2.40)", shelfLifeDays: 180 },
  { id: "split-peas", name: "Split peas", category: "grain", estimatedUnitCost: 0.85, unit: "cup-dry", commonPackageSize: "1 lb (~$2)", shelfLifeDays: 730, tags: ["vegan", "cheap"] },
  { id: "tortilla-chips-2", name: "Tortilla chips (small bag)", category: "snack", estimatedUnitCost: 0.40, unit: "serving", commonPackageSize: "9 oz (~$3.50)", shelfLifeDays: 60 },
  // 32 oz chicken broth $3 = 4 cups.
  { id: "chicken-broth", name: "Chicken broth", category: "canned", estimatedUnitCost: 0.75, unit: "cup", commonPackageSize: "32 oz (~$3)", shelfLifeDays: 365 },
  { id: "veggie-broth", name: "Vegetable broth", category: "canned", estimatedUnitCost: 0.75, unit: "cup", commonPackageSize: "32 oz (~$3)", shelfLifeDays: 365, tags: ["vegan"] },
  { id: "tomato-soup-can", name: "Canned tomato soup", category: "canned", estimatedUnitCost: 1.80, unit: "can", commonPackageSize: "10.75 oz can (~$1.80)", shelfLifeDays: 730 },
  { id: "canned-chili", name: "Canned chili", category: "canned", estimatedUnitCost: 2.50, unit: "can", commonPackageSize: "15 oz can (~$2.50)", shelfLifeDays: 730 },
  { id: "canned-salmon", name: "Canned salmon", category: "canned", estimatedUnitCost: 3.50, unit: "can", commonPackageSize: "6 oz can (~$3.50)", shelfLifeDays: 730, tags: ["high-protein"] },
  // 12 oz teriyaki $3.50 = ~24 tbsp.
  { id: "teriyaki-sauce", name: "Teriyaki sauce", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "12 oz (~$3.50)", shelfLifeDays: 365 },
  { id: "taco-seasoning", name: "Taco seasoning", category: "spice", estimatedUnitCost: 0.85, unit: "packet", commonPackageSize: "1 oz packet (~$0.85)", shelfLifeDays: 730 },
  // 4 oz curry paste $4 = ~8 tbsp.
  { id: "curry-paste", name: "Curry paste", category: "condiment", estimatedUnitCost: 0.50, unit: "tbsp", commonPackageSize: "4 oz (~$4)", shelfLifeDays: 365 },
  // 6 oz chili oil $6 = ~36 tsp.
  { id: "chili-oil", name: "Chili oil", category: "condiment", estimatedUnitCost: 0.17, unit: "tsp", commonPackageSize: "6 oz (~$6)", shelfLifeDays: 365 },
  // 6 oz pepperoni $5.
  { id: "pepperoni", name: "Pepperoni", category: "protein", estimatedUnitCost: 0.85, unit: "oz", commonPackageSize: "6 oz (~$5)", shelfLifeDays: 21 },
  { id: "rice-cakes", name: "Rice cakes", category: "snack", estimatedUnitCost: 0.25, unit: "cake", commonPackageSize: "12 ct (~$3)", shelfLifeDays: 90, tags: ["gluten-free"] },
  // 12 oz granola $5.50, ~3 servings of 1/2 cup.
  { id: "granola", name: "Granola", category: "grain", estimatedUnitCost: 0.92, unit: "1/2 cup", commonPackageSize: "12 oz (~$5.50)", shelfLifeDays: 180 },
  // 14 oz udon $4, ~3 servings.
  { id: "udon", name: "Udon noodles", category: "grain", estimatedUnitCost: 1.35, unit: "serving", commonPackageSize: "14 oz (~$4)", shelfLifeDays: 180 },
  // 2 oz turmeric $3.50 = ~12 tsp.
  { id: "turmeric", name: "Turmeric", category: "spice", estimatedUnitCost: 0.29, unit: "tsp", commonPackageSize: "2 oz (~$3.50)", shelfLifeDays: 730 },
  // 5 oz hot sauce $3.50 = ~30 tsp.
  { id: "hot-sauce", name: "Hot sauce", category: "condiment", estimatedUnitCost: 0.12, unit: "tsp", commonPackageSize: "5 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "gravy-mix", name: "Gravy mix packet", category: "condiment", estimatedUnitCost: 0.95, unit: "packet", commonPackageSize: "0.87 oz packet (~$0.95)", shelfLifeDays: 730 },

  // ===== Comprehensive flavor expansion =====

  // Spices & seasoning blends — 1 oz ≈ 6 tsp (most ground spices). $3.50/jar typical.
  { id: "white-pepper", name: "White pepper", category: "spice", estimatedUnitCost: 0.39, unit: "tsp", commonPackageSize: "1.7 oz (~$4)", shelfLifeDays: 730 },
  { id: "smoked-paprika", name: "Smoked paprika", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "2 oz (~$4)", shelfLifeDays: 730 },
  { id: "cayenne", name: "Cayenne pepper", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "2 oz (~$3)", shelfLifeDays: 730 },
  { id: "coriander-seed", name: "Ground coriander", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "garam-masala", name: "Garam masala", category: "spice", estimatedUnitCost: 0.38, unit: "tsp", commonPackageSize: "2.2 oz (~$5)", shelfLifeDays: 730 },
  { id: "nutmeg", name: "Nutmeg", category: "spice", estimatedUnitCost: 0.61, unit: "tsp", commonPackageSize: "1.1 oz (~$4)", shelfLifeDays: 1095 },
  { id: "cloves-ground", name: "Ground cloves", category: "spice", estimatedUnitCost: 0.74, unit: "tsp", commonPackageSize: "0.9 oz (~$4)", shelfLifeDays: 730 },
  { id: "allspice", name: "Allspice", category: "spice", estimatedUnitCost: 0.58, unit: "tsp", commonPackageSize: "1 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "ginger-ground", name: "Ground ginger", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "mustard-powder", name: "Mustard powder", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "2 oz (~$3)", shelfLifeDays: 730 },
  { id: "sage-dried", name: "Dried sage", category: "spice", estimatedUnitCost: 1.25, unit: "tsp", commonPackageSize: "0.4 oz (~$3)", shelfLifeDays: 730 },
  { id: "parsley-dried", name: "Dried parsley", category: "spice", estimatedUnitCost: 1.00, unit: "tsp", commonPackageSize: "0.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "dill-dried", name: "Dried dill", category: "spice", estimatedUnitCost: 1.25, unit: "tsp", commonPackageSize: "0.4 oz (~$3)", shelfLifeDays: 730 },
  { id: "tarragon-dried", name: "Dried tarragon", category: "spice", estimatedUnitCost: 1.67, unit: "tsp", commonPackageSize: "0.4 oz (~$4)", shelfLifeDays: 730 },
  { id: "herbes-provence", name: "Herbes de Provence", category: "spice", estimatedUnitCost: 0.95, unit: "tsp", commonPackageSize: "0.7 oz (~$4)", shelfLifeDays: 730 },
  { id: "poultry-seasoning", name: "Poultry seasoning", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  { id: "lemon-pepper", name: "Lemon pepper seasoning", category: "spice", estimatedUnitCost: 0.27, unit: "tsp", commonPackageSize: "2.5 oz (~$4)", shelfLifeDays: 730 },
  { id: "seasoned-salt", name: "Seasoned salt", category: "spice", estimatedUnitCost: 0.06, unit: "tsp", commonPackageSize: "8 oz (~$3)", shelfLifeDays: 1095 },
  { id: "old-bay", name: "Old Bay seasoning", category: "spice", estimatedUnitCost: 0.26, unit: "tsp", commonPackageSize: "2.6 oz (~$4)", shelfLifeDays: 730 },
  { id: "cajun-seasoning", name: "Cajun seasoning", category: "spice", estimatedUnitCost: 0.39, unit: "tsp", commonPackageSize: "1.7 oz (~$4)", shelfLifeDays: 730 },
  { id: "creole-seasoning", name: "Creole seasoning", category: "spice", estimatedUnitCost: 0.39, unit: "tsp", commonPackageSize: "1.7 oz (~$4)", shelfLifeDays: 730 },
  { id: "ranch-seasoning", name: "Ranch seasoning", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "1 oz packet (~$1.50)", shelfLifeDays: 730 },
  { id: "everything-bagel", name: "Everything bagel seasoning", category: "spice", estimatedUnitCost: 0.22, unit: "tsp", commonPackageSize: "3.7 oz (~$5)", shelfLifeDays: 730 },
  { id: "chinese-5-spice", name: "Chinese five spice", category: "spice", estimatedUnitCost: 0.37, unit: "tsp", commonPackageSize: "1.8 oz (~$4)", shelfLifeDays: 730 },
  { id: "zaatar", name: "Za'atar", category: "spice", estimatedUnitCost: 0.42, unit: "tsp", commonPackageSize: "2 oz (~$5)", shelfLifeDays: 730 },
  { id: "sumac", name: "Sumac", category: "spice", estimatedUnitCost: 0.47, unit: "tsp", commonPackageSize: "1.6 oz (~$4.50)", shelfLifeDays: 730 },
  { id: "furikake", name: "Furikake", category: "spice", estimatedUnitCost: 0.49, unit: "tsp", commonPackageSize: "1.7 oz (~$5)", shelfLifeDays: 365, tags: ["umami"] },
  { id: "shichimi", name: "Shichimi togarashi", category: "spice", estimatedUnitCost: 1.33, unit: "tsp", commonPackageSize: "0.5 oz (~$4)", shelfLifeDays: 365 },
  // 8 oz gochugaru $8 = ~48 tsp.
  { id: "gochugaru", name: "Gochugaru (Korean chili flakes)", category: "spice", estimatedUnitCost: 0.17, unit: "tsp", commonPackageSize: "8 oz (~$8)", shelfLifeDays: 365 },
  // 3 oz sesame seeds $4 = ~18 tsp.
  { id: "sesame-seeds", name: "Sesame seeds", category: "spice", estimatedUnitCost: 0.22, unit: "tsp", commonPackageSize: "3 oz (~$4)", shelfLifeDays: 365 },
  { id: "black-sesame", name: "Black sesame seeds", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "3 oz (~$4.50)", shelfLifeDays: 365 },
  { id: "taco-seasoning-2", name: "Taco seasoning (homemade-style)", category: "spice", estimatedUnitCost: 0.13, unit: "tsp", commonPackageSize: "1 oz packet (~$0.80)", shelfLifeDays: 730 },

  // Fresh aromatics & herbs
  { id: "shallot", name: "Shallot", category: "vegetable", estimatedUnitCost: 0.75, unit: "shallot", commonPackageSize: "single (~$0.75)", shelfLifeDays: 30 },
  // Bunch fresh cilantro $1, ~6 tbsp chopped.
  { id: "cilantro-fresh", name: "Fresh cilantro", category: "vegetable", estimatedUnitCost: 0.17, unit: "tbsp", commonPackageSize: "bunch (~$1)", shelfLifeDays: 7 },
  { id: "parsley-fresh", name: "Fresh parsley", category: "vegetable", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "bunch (~$1.50)", shelfLifeDays: 7 },
  // 0.75 oz fresh basil clamshell $3.50, ~6 tbsp chopped.
  { id: "basil-fresh", name: "Fresh basil", category: "vegetable", estimatedUnitCost: 0.58, unit: "tbsp", commonPackageSize: "0.75 oz (~$3.50)", shelfLifeDays: 5 },
  { id: "mint-fresh", name: "Fresh mint", category: "vegetable", estimatedUnitCost: 0.58, unit: "tbsp", commonPackageSize: "0.75 oz (~$3.50)", shelfLifeDays: 5 },
  { id: "dill-fresh", name: "Fresh dill", category: "vegetable", estimatedUnitCost: 0.60, unit: "tbsp", commonPackageSize: "0.5 oz (~$3)", shelfLifeDays: 5 },
  { id: "rosemary-fresh", name: "Fresh rosemary", category: "vegetable", estimatedUnitCost: 0.30, unit: "sprig", commonPackageSize: "0.5 oz (~$3)", shelfLifeDays: 14 },
  { id: "thyme-fresh", name: "Fresh thyme", category: "vegetable", estimatedUnitCost: 0.30, unit: "sprig", commonPackageSize: "0.5 oz (~$3)", shelfLifeDays: 14 },
  { id: "serrano", name: "Serrano pepper", category: "vegetable", estimatedUnitCost: 0.25, unit: "pepper", commonPackageSize: "single (~$0.25)", shelfLifeDays: 14 },
  { id: "habanero", name: "Habanero", category: "vegetable", estimatedUnitCost: 0.40, unit: "pepper", commonPackageSize: "single (~$0.40)", shelfLifeDays: 14 },
  { id: "thai-chili", name: "Thai chili", category: "vegetable", estimatedUnitCost: 0.12, unit: "pepper", commonPackageSize: "single (~$0.12)", shelfLifeDays: 14 },
  { id: "lemon-zest", name: "Lemon zest", category: "fruit", estimatedUnitCost: 0.30, unit: "tsp", commonPackageSize: "from 1 lemon", shelfLifeDays: 7 },
  { id: "lime", name: "Lime", category: "fruit", estimatedUnitCost: 0.45, unit: "lime", commonPackageSize: "single (~$0.45)", shelfLifeDays: 14 },
  { id: "lime-zest", name: "Lime zest", category: "fruit", estimatedUnitCost: 0.20, unit: "tsp", commonPackageSize: "from 1 lime", shelfLifeDays: 7 },

  // Sauces & condiments — Asian / fermented
  // 10 oz low-sodium soy $4 = ~20 tbsp.
  { id: "low-sodium-soy", name: "Low-sodium soy sauce", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "10 oz (~$4)", shelfLifeDays: 365 },
  // 16 oz dark soy $5.50 = ~32 tbsp.
  { id: "dark-soy", name: "Dark soy sauce", category: "condiment", estimatedUnitCost: 0.17, unit: "tbsp", commonPackageSize: "16 oz (~$5.50)", shelfLifeDays: 365 },
  // 10 oz tamari $5.50 = ~20 tbsp.
  { id: "tamari", name: "Tamari", category: "condiment", estimatedUnitCost: 0.28, unit: "tbsp", commonPackageSize: "10 oz (~$5.50)", shelfLifeDays: 365, tags: ["gluten-free"] },
  // 18 oz oyster sauce $4.50 = ~36 tbsp.
  { id: "oyster-sauce", name: "Oyster sauce", category: "condiment", estimatedUnitCost: 0.13, unit: "tbsp", commonPackageSize: "18 oz (~$4.50)", shelfLifeDays: 365 },
  // 10 oz ponzu $4.50 = ~20 tbsp.
  { id: "ponzu", name: "Ponzu", category: "condiment", estimatedUnitCost: 0.23, unit: "tbsp", commonPackageSize: "10 oz (~$4.50)", shelfLifeDays: 365 },
  // 10 oz mirin $5 = ~20 tbsp.
  { id: "mirin", name: "Mirin", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "10 oz (~$5)", shelfLifeDays: 365 },
  // 8 oz chili-garlic sauce $4.50 = ~48 tsp.
  { id: "chili-garlic-sauce", name: "Chili garlic sauce", category: "condiment", estimatedUnitCost: 0.09, unit: "tsp", commonPackageSize: "8 oz (~$4.50)", shelfLifeDays: 365 },
  // 7.4 oz chili crisp $6 = ~44 tsp.
  { id: "chili-crisp", name: "Chili crisp", category: "condiment", estimatedUnitCost: 0.14, unit: "tsp", commonPackageSize: "7.4 oz (~$6)", shelfLifeDays: 365 },
  { id: "laoganma", name: "Lao Gan Ma chili crisp", category: "condiment", estimatedUnitCost: 0.14, unit: "tsp", commonPackageSize: "7.4 oz (~$6)", shelfLifeDays: 365 },
  // 17.6 oz gochujang tub $7 = ~35 tbsp.
  { id: "gochujang", name: "Gochujang", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "17.6 oz (~$7)", shelfLifeDays: 365 },
  { id: "doenjang", name: "Doenjang", category: "condiment", estimatedUnitCost: 0.19, unit: "tbsp", commonPackageSize: "16 oz tub (~$6)", shelfLifeDays: 365 },
  // 17.6 oz Kewpie mayo $6 = ~35 tbsp.
  { id: "kewpie-mayo", name: "Kewpie mayo", category: "condiment", estimatedUnitCost: 0.17, unit: "tbsp", commonPackageSize: "17.6 oz (~$6)", shelfLifeDays: 365 },
  // 4 oz curry paste $4 = ~8 tbsp.
  { id: "red-curry-paste", name: "Red curry paste", category: "condiment", estimatedUnitCost: 0.50, unit: "tbsp", commonPackageSize: "4 oz (~$4)", shelfLifeDays: 365 },
  { id: "green-curry-paste", name: "Green curry paste", category: "condiment", estimatedUnitCost: 0.50, unit: "tbsp", commonPackageSize: "4 oz (~$4)", shelfLifeDays: 365 },
  { id: "yellow-curry-paste", name: "Yellow curry paste", category: "condiment", estimatedUnitCost: 0.50, unit: "tbsp", commonPackageSize: "4 oz (~$4)", shelfLifeDays: 365 },

  // Sauces & condiments — other
  // 8 oz Dijon $4.50 = ~48 tsp.
  { id: "dijon", name: "Dijon mustard", category: "condiment", estimatedUnitCost: 0.09, unit: "tsp", commonPackageSize: "8 oz (~$4.50)", shelfLifeDays: 365 },
  { id: "yellow-mustard", name: "Yellow mustard", category: "condiment", estimatedUnitCost: 0.03, unit: "tsp", commonPackageSize: "14 oz (~$2.50)", shelfLifeDays: 365 },
  // 6 oz harissa $4.50 = ~12 tbsp.
  { id: "harissa", name: "Harissa", category: "condiment", estimatedUnitCost: 0.38, unit: "tbsp", commonPackageSize: "6 oz (~$4.50)", shelfLifeDays: 365 },
  // 12 oz buffalo $3.50 = ~24 tbsp.
  { id: "buffalo-sauce", name: "Buffalo sauce", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "12 oz (~$3.50)", shelfLifeDays: 180 },
  // 10 oz Worcestershire $4 = ~60 tsp.
  { id: "worcestershire", name: "Worcestershire sauce", category: "condiment", estimatedUnitCost: 0.07, unit: "tsp", commonPackageSize: "10 oz (~$4)", shelfLifeDays: 730 },
  // 10 oz steak sauce $4 = ~20 tbsp.
  { id: "steak-sauce", name: "Steak sauce", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "10 oz (~$4)", shelfLifeDays: 365 },
  // 17 oz agave $6 = ~34 tbsp.
  { id: "agave", name: "Agave nectar", category: "condiment", estimatedUnitCost: 0.18, unit: "tbsp", commonPackageSize: "17 oz (~$6)", shelfLifeDays: 730 },
  // 12 oz pico tub $4.50, ~6 servings of 1/4 cup.
  { id: "pico", name: "Pico de gallo", category: "vegetable", estimatedUnitCost: 0.75, unit: "1/4 cup", commonPackageSize: "12 oz tub (~$4.50)", shelfLifeDays: 7 },
  // 24 oz marinara $3.50 = 3 cups.
  { id: "marinara", name: "Marinara sauce", category: "canned", estimatedUnitCost: 1.17, unit: "cup", commonPackageSize: "24 oz jar (~$3.50)", shelfLifeDays: 730 },
  // 6 oz tomato paste can $1.25 = ~12 tbsp.
  { id: "tomato-paste", name: "Tomato paste", category: "canned", estimatedUnitCost: 0.10, unit: "tbsp", commonPackageSize: "6 oz can (~$1.25)", shelfLifeDays: 730, tags: ["umami"] },

  // Oils & fats
  { id: "evoo", name: "Extra virgin olive oil", category: "condiment", estimatedUnitCost: 0.32, unit: "tbsp", commonPackageSize: "17 oz (~$11)", shelfLifeDays: 365 },
  { id: "canola-oil", name: "Canola oil", category: "condiment", estimatedUnitCost: 0.05, unit: "tbsp", commonPackageSize: "48 oz (~$5)", shelfLifeDays: 365 },
  // 10 oz toasted sesame oil $9 = ~60 tsp.
  { id: "toasted-sesame-oil", name: "Toasted sesame oil", category: "condiment", estimatedUnitCost: 0.15, unit: "tsp", commonPackageSize: "10 oz (~$9)", shelfLifeDays: 365 },
  // 13 oz ghee jar $9 = ~26 tbsp.
  { id: "ghee", name: "Ghee", category: "condiment", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "13 oz (~$9)", shelfLifeDays: 365 },
  // 14 oz coconut oil $6 = ~28 tbsp.
  { id: "coconut-oil", name: "Coconut oil", category: "condiment", estimatedUnitCost: 0.21, unit: "tbsp", commonPackageSize: "14 oz (~$6)", shelfLifeDays: 730 },
  { id: "avocado-oil", name: "Avocado oil", category: "condiment", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "17 oz (~$12)", shelfLifeDays: 365 },
  { id: "cooking-spray", name: "Cooking spray", category: "condiment", estimatedUnitCost: 0.02, unit: "spray", commonPackageSize: "6 oz (~$4.50)", shelfLifeDays: 730 },

  // Vinegars
  { id: "balsamic", name: "Balsamic vinegar", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "16 oz (~$6)", shelfLifeDays: 1095 },
  { id: "red-wine-vinegar", name: "Red wine vinegar", category: "condiment", estimatedUnitCost: 0.10, unit: "tbsp", commonPackageSize: "16 oz (~$3.50)", shelfLifeDays: 1095 },
  { id: "apple-cider-vinegar", name: "Apple cider vinegar", category: "condiment", estimatedUnitCost: 0.11, unit: "tbsp", commonPackageSize: "16 oz (~$3.50)", shelfLifeDays: 1095, tags: ["acidic"] },

  // Umami / broths / pastes
  // 16 oz MSG $6 = ~96 tsp.
  { id: "msg", name: "MSG", category: "spice", estimatedUnitCost: 0.06, unit: "tsp", commonPackageSize: "16 oz (~$6)", shelfLifeDays: 1825, tags: ["umami"] },
  // 4.5 oz nooch $6 = ~27 tbsp.
  { id: "nutritional-yeast", name: "Nutritional yeast", category: "condiment", estimatedUnitCost: 0.22, unit: "tbsp", commonPackageSize: "4.5 oz (~$6)", shelfLifeDays: 730, tags: ["vegan", "umami"] },
  { id: "bouillon-cube", name: "Bouillon cube", category: "canned", estimatedUnitCost: 0.25, unit: "cube", commonPackageSize: "12 cubes (~$3)", shelfLifeDays: 730 },
  // 8 oz chicken bouillon $6 = ~48 tsp.
  { id: "chicken-bouillon", name: "Chicken bouillon", category: "canned", estimatedUnitCost: 0.13, unit: "tsp", commonPackageSize: "8 oz jar (~$6)", shelfLifeDays: 1095 },
  { id: "beef-broth", name: "Beef broth", category: "canned", estimatedUnitCost: 0.85, unit: "cup", commonPackageSize: "32 oz (~$3.50)", shelfLifeDays: 365 },
  // 2 oz mushroom powder $8 = ~12 tsp.
  { id: "mushroom-powder", name: "Dried mushroom powder", category: "spice", estimatedUnitCost: 0.67, unit: "tsp", commonPackageSize: "2 oz (~$8)", shelfLifeDays: 365, tags: ["umami", "vegan"] },
  // 2 oz anchovy paste tube $4.50 = ~12 tsp.
  { id: "anchovy-paste", name: "Anchovy paste", category: "condiment", estimatedUnitCost: 0.38, unit: "tsp", commonPackageSize: "2 oz (~$4.50)", shelfLifeDays: 365, tags: ["umami"] },

  // Sweeteners
  { id: "white-sugar", name: "White sugar", category: "spice", estimatedUnitCost: 0.02, unit: "tbsp", commonPackageSize: "4 lb (~$3.50)", shelfLifeDays: 3650 },

  // ==========================================================
  // ============== Pantry expansion (v2) =====================
  // ==========================================================
  // ~305 ingredients added in the pantry-expansion pass: deeper
  // cuisine coverage, more proteins/produce, baking essentials,
  // and global specialty staples. Pricing math noted per line.
  // ==========================================================

  // ===== Grains, breads, noodles =====
  // 5 lb bag $8, ~11 cups dry, $0.73/cup dry, $0.18 per 1/4 cup dry serving
  { id: "jasmine-rice", name: "Jasmine rice", category: "grain", estimatedUnitCost: 0.18, unit: "cup-dry", commonPackageSize: "5 lb bag (~$8.00)", shelfLifeDays: 730, tags: ["staple","cheap","vegan","gluten-free"] },
  // 4 lb bag $9, ~9 cups dry, $1.00/cup dry, $0.22 per 1/4 cup dry serving
  { id: "basmati-rice", name: "Basmati rice", category: "grain", estimatedUnitCost: 0.22, unit: "cup-dry", commonPackageSize: "4 lb bag (~$9.00)", shelfLifeDays: 730, tags: ["staple","cheap","vegan","gluten-free"] },
  // 2 lb bag $5.50, ~4.5 cups dry, $1.22/cup dry, $0.28 per 1/4 cup dry serving
  { id: "sushi-rice", name: "Sushi rice", category: "grain", estimatedUnitCost: 0.28, unit: "cup-dry", commonPackageSize: "2 lb bag (~$5.50)", shelfLifeDays: 730, tags: ["vegan","gluten-free"] },
  // 1 lb bag $4.50, ~2.25 cups dry, $2.00/cup dry, $0.45 per 1/4 cup dry serving
  { id: "arborio-rice", name: "Arborio rice", category: "grain", estimatedUnitCost: 0.45, unit: "cup-dry", commonPackageSize: "1 lb bag (~$4.50)", shelfLifeDays: 730, tags: ["vegan","gluten-free"] },
  // 1 lb bag $5, ~2.25 cups dry, $2.22/cup dry, $0.55 per 1/4 cup dry serving
  { id: "farro", name: "Farro", category: "grain", estimatedUnitCost: 0.55, unit: "cup-dry", commonPackageSize: "1 lb bag (~$5.00)", shelfLifeDays: 730, tags: ["vegan","high-protein"] },
  // 16 oz $2.50, ~2.5 cups dry, $1.00/cup dry, $0.25 per 1/4 cup dry serving
  { id: "barley", name: "Pearl barley", category: "grain", estimatedUnitCost: 0.25, unit: "cup-dry", commonPackageSize: "16 oz bag (~$2.50)", shelfLifeDays: 730, tags: ["cheap","vegan"] },
  // 1 lb $3.50, ~3 cups dry, $1.17/cup dry, $0.30 per 1/4 cup dry serving
  { id: "bulgur", name: "Bulgur wheat", category: "grain", estimatedUnitCost: 0.3, unit: "cup-dry", commonPackageSize: "1 lb bag (~$3.50)", shelfLifeDays: 730, tags: ["cheap","vegan","high-protein"] },
  // 24 oz $3.50, ~5 cups, $0.70/cup, $0.20 per 1/4 cup serving
  { id: "cornmeal", name: "Cornmeal (polenta)", category: "grain", estimatedUnitCost: 0.2, unit: "cup-dry", commonPackageSize: "24 oz bag (~$3.50)", shelfLifeDays: 365, tags: ["cheap","vegan","gluten-free"] },
  // 16 oz $4, ~3.5 cups, $1.14/cup, $0.45 per 1/2 cup serving
  { id: "rice-flour", name: "Rice flour", category: "grain", estimatedUnitCost: 0.45, unit: "cup", commonPackageSize: "16 oz bag (~$4.00)", shelfLifeDays: 365, tags: ["vegan","gluten-free","baking"] },
  // 16 oz $10, ~4 cups, $2.50/cup, $1.20 per 1/2 cup serving
  { id: "almond-flour", name: "Almond flour", category: "grain", estimatedUnitCost: 1.2, unit: "cup", commonPackageSize: "16 oz bag (~$10.00)", shelfLifeDays: 180, tags: ["vegan","gluten-free","baking","high-protein"] },
  // 8 oz box $3, ~5 cups, $0.60/cup, $0.30 per 1/2 cup serving
  { id: "panko", name: "Panko breadcrumbs", category: "grain", estimatedUnitCost: 0.3, unit: "cup", commonPackageSize: "8 oz box (~$3.00)", shelfLifeDays: 365, tags: ["cheap","vegan"] },
  // 15 oz $2.50, ~5 cups, $0.50/cup, $0.25 per 1/2 cup serving
  { id: "breadcrumbs", name: "Italian breadcrumbs", category: "grain", estimatedUnitCost: 0.25, unit: "cup", commonPackageSize: "15 oz canister (~$2.50)", shelfLifeDays: 365, tags: ["cheap","vegan"] },
  // 17.6 oz pack $3, ~2 servings, $1.50/serving
  { id: "gnocchi", name: "Potato gnocchi", category: "grain", estimatedUnitCost: 1.5, unit: "serving", commonPackageSize: "17.6 oz pack (~$3.00)", shelfLifeDays: 365, tags: ["vegetarian"] },
  // $4 / 50 wrappers = $0.08, round to $0.10 per piece
  { id: "dumpling-wrappers", name: "Dumpling wrappers", category: "grain", estimatedUnitCost: 0.1, unit: "piece", commonPackageSize: "12 oz pack ~50 wrappers (~$4.00)", shelfLifeDays: 30, tags: ["vegan"] },
  // $3.50 / 60 wrappers = ~$0.06 per piece
  { id: "wonton-wrappers", name: "Wonton wrappers", category: "grain", estimatedUnitCost: 0.06, unit: "piece", commonPackageSize: "12 oz pack ~60 wrappers (~$3.50)", shelfLifeDays: 30, tags: ["vegan"] },
  // 16 oz box $2, ~7 servings, $0.29/serving
  { id: "spaghetti", name: "Spaghetti", category: "grain", estimatedUnitCost: 0.3, unit: "serving", commonPackageSize: "16 oz box (~$2.00)", shelfLifeDays: 730, tags: ["staple","cheap","vegan"] },
  // 16 oz box $2, ~7 servings, $0.29/serving
  { id: "penne", name: "Penne", category: "grain", estimatedUnitCost: 0.3, unit: "serving", commonPackageSize: "16 oz box (~$2.00)", shelfLifeDays: 730, tags: ["staple","cheap","vegan"] },
  // 16 oz box $1.80, ~7 servings, $0.26/serving
  { id: "macaroni", name: "Elbow macaroni", category: "grain", estimatedUnitCost: 0.28, unit: "serving", commonPackageSize: "16 oz box (~$1.80)", shelfLifeDays: 730, tags: ["staple","cheap","vegan"] },
  // 16 oz box $2.80, ~7 servings, $0.40/serving
  { id: "orzo", name: "Orzo", category: "grain", estimatedUnitCost: 0.4, unit: "serving", commonPackageSize: "16 oz box (~$2.80)", shelfLifeDays: 730, tags: ["cheap","vegan"] },
  // 16 oz box $3.50, ~6 servings, $0.58/serving
  { id: "lasagna-noodles", name: "Lasagna noodles", category: "grain", estimatedUnitCost: 0.55, unit: "serving", commonPackageSize: "16 oz box (~$3.50)", shelfLifeDays: 730, tags: ["vegan"] },
  // $5 / 4 pieces = $1.25 each
  { id: "naan", name: "Naan bread", category: "grain", estimatedUnitCost: 1.25, unit: "piece", commonPackageSize: "4-pack (~$5.00)", shelfLifeDays: 14, tags: ["vegetarian"] },
  // $6.50 / 16 slices = $0.41/slice
  { id: "sourdough", name: "Sourdough bread", category: "grain", estimatedUnitCost: 0.4, unit: "slice", commonPackageSize: "24 oz loaf ~16 slices (~$6.50)", shelfLifeDays: 7, tags: ["vegan"] },
  // $6.50 / 8 buns = $0.81/bun
  { id: "brioche-buns", name: "Brioche buns", category: "grain", estimatedUnitCost: 0.85, unit: "piece", commonPackageSize: "8-pack (~$6.50)", shelfLifeDays: 7, tags: ["vegetarian"] },
  // $3 / 8 buns = $0.38/bun
  { id: "hot-dog-buns", name: "Hot dog buns", category: "grain", estimatedUnitCost: 0.4, unit: "piece", commonPackageSize: "8-pack (~$3.00)", shelfLifeDays: 7, tags: ["cheap","vegan"] },
  // $3 / 8 buns = $0.38/bun
  { id: "hamburger-buns", name: "Hamburger buns", category: "grain", estimatedUnitCost: 0.4, unit: "piece", commonPackageSize: "8-pack (~$3.00)", shelfLifeDays: 7, tags: ["cheap","vegan"] },
  // $2.50 per 16 oz dough ball, makes 1 pizza
  { id: "pizza-dough", name: "Refrigerated pizza dough", category: "grain", estimatedUnitCost: 2.5, unit: "bag", commonPackageSize: "16 oz ball (~$2.50)", shelfLifeDays: 14, tags: ["vegan"] },
  // 32 oz box $4, ~12 servings, $0.33/serving
  { id: "pancake-mix", name: "Pancake mix", category: "grain", estimatedUnitCost: 0.35, unit: "serving", commonPackageSize: "32 oz box (~$4.00)", shelfLifeDays: 365, tags: ["cheap","vegetarian","baking"] },
  // $3.50 / 30 wrappers = $0.12 each
  { id: "rice-paper", name: "Rice paper wrappers", category: "grain", estimatedUnitCost: 0.12, unit: "piece", commonPackageSize: "12 oz pack ~30 wrappers (~$3.50)", shelfLifeDays: 730, tags: ["vegan","gluten-free"] },
  // 16 oz bag $3.50, ~3 cups, $1.17/cup, $0.60 per 1/2 cup serving
  { id: "glutinous-rice-flour", name: "Glutinous rice flour", category: "grain", estimatedUnitCost: 0.6, unit: "cup", commonPackageSize: "16 oz bag (~$3.50)", shelfLifeDays: 365, tags: ["vegan","gluten-free","baking"] },
  // 14 oz pack $3, ~6 servings, $0.50/serving
  { id: "vermicelli-rice-noodles", name: "Rice vermicelli", category: "grain", estimatedUnitCost: 0.5, unit: "serving", commonPackageSize: "14 oz pack (~$3.00)", shelfLifeDays: 730, tags: ["cheap","vegan","gluten-free"] },
  // 2 lb $5, ~10 cups dry = $0.50/cup-dry
  { id: "urad-dal", name: "Urad dal", category: "grain", estimatedUnitCost: 0.5, unit: "cup-dry", commonPackageSize: "2 lb bag (~$5)", shelfLifeDays: 730, tags: ["vegan","high-protein","cheap"] },
  // 2 lb $5, ~10 cups dry = $0.50/cup-dry
  { id: "chana-dal", name: "Chana dal", category: "grain", estimatedUnitCost: 0.5, unit: "cup-dry", commonPackageSize: "2 lb bag (~$5)", shelfLifeDays: 730, tags: ["vegan","high-protein","cheap"] },
  // 2 lb $5.50, ~10 cups dry = $0.55/cup-dry
  { id: "toor-dal", name: "Toor dal", category: "grain", estimatedUnitCost: 0.55, unit: "cup-dry", commonPackageSize: "2 lb bag (~$5.50)", shelfLifeDays: 730, tags: ["vegan","high-protein","cheap"] },
  // 4.4 lb $6, ~30 cups = $0.20/cup
  { id: "masa-harina", name: "Masa harina", category: "grain", estimatedUnitCost: 0.2, unit: "cup", commonPackageSize: "4.4 lb bag (~$6)", shelfLifeDays: 365, tags: ["vegan","gluten-free","cheap","staple"] },

  // ===== Proteins (meat, seafood, plant) =====
  // $7 / 4 chops = $1.75 per chop
  { id: "pork-chop", name: "Pork chop", category: "protein", estimatedUnitCost: 1.75, unit: "piece", commonPackageSize: "Family pack 4 bone-in chops ~$7", shelfLifeDays: 4, tags: ["high-protein","gluten-free"] },
  // $11 / 20 oz = $0.55/oz
  { id: "pork-tenderloin", name: "Pork tenderloin", category: "protein", estimatedUnitCost: 0.55, unit: "oz", commonPackageSize: "1.25 lb tenderloin ~$11", shelfLifeDays: 4, tags: ["high-protein","gluten-free"] },
  // $16 / 64 oz = $0.25/oz
  { id: "pork-shoulder", name: "Pork shoulder", category: "protein", estimatedUnitCost: 0.25, unit: "oz", commonPackageSize: "4 lb bone-in shoulder ~$16", shelfLifeDays: 4, tags: ["high-protein","gluten-free","cheap"] },
  // $6 / 10 servings = $0.60/serving
  { id: "rotisserie-chicken", name: "Rotisserie chicken", category: "protein", estimatedUnitCost: 0.6, unit: "serving", commonPackageSize: "Whole rotisserie chicken ~$6 (~10 servings)", shelfLifeDays: 4, tags: ["high-protein","gluten-free","cheap"] },
  // $10 / 30 wings = $0.33/wing rounded
  { id: "chicken-wings", name: "Chicken wings", category: "protein", estimatedUnitCost: 0.35, unit: "piece", commonPackageSize: "3 lb pack ~$10 (~30 wings)", shelfLifeDays: 4, tags: ["high-protein","gluten-free"] },
  // $8.50 / 10 = $0.85/drumstick
  { id: "chicken-drumsticks", name: "Chicken drumsticks", category: "protein", estimatedUnitCost: 0.85, unit: "piece", commonPackageSize: "Family pack 10 drumsticks ~$8.50", shelfLifeDays: 4, tags: ["high-protein","gluten-free","cheap"] },
  // $6.40 / 16 oz = $0.40/oz
  { id: "ground-pork", name: "Ground pork", category: "protein", estimatedUnitCost: 0.4, unit: "oz", commonPackageSize: "1 lb pack ~$6.40", shelfLifeDays: 3, tags: ["high-protein","gluten-free"] },
  // $7 / 16 oz ~ $0.44/oz
  { id: "ground-chicken", name: "Ground chicken", category: "protein", estimatedUnitCost: 0.45, unit: "oz", commonPackageSize: "1 lb pack ~$7", shelfLifeDays: 3, tags: ["high-protein","gluten-free"] },
  // $13.60 / 16 oz = $0.85/oz
  { id: "sirloin-steak", name: "Sirloin steak", category: "protein", estimatedUnitCost: 0.85, unit: "oz", commonPackageSize: "1 lb sirloin ~$13.60", shelfLifeDays: 4, tags: ["high-protein","gluten-free"] },
  // $24 / 24 oz = $1.00/oz
  { id: "flank-steak", name: "Flank steak", category: "protein", estimatedUnitCost: 1, unit: "oz", commonPackageSize: "1.5 lb flank ~$24", shelfLifeDays: 4, tags: ["high-protein","gluten-free"] },
  // $8.80 / 16 oz = $0.55/oz
  { id: "beef-stew-meat", name: "Beef stew meat", category: "protein", estimatedUnitCost: 0.55, unit: "oz", commonPackageSize: "1 lb stew meat ~$8.80", shelfLifeDays: 4, tags: ["high-protein","gluten-free"] },
  // $5 / 4 servings = $1.25/serving
  { id: "chorizo", name: "Chorizo sausage", category: "protein", estimatedUnitCost: 1.25, unit: "serving", commonPackageSize: "12 oz package ~$5 (~4 servings)", shelfLifeDays: 14, tags: ["high-protein","gluten-free"] },
  // $6 / 4 oz = $1.50/oz
  { id: "prosciutto", name: "Prosciutto", category: "protein", estimatedUnitCost: 1.5, unit: "oz", commonPackageSize: "4 oz pack ~$6", shelfLifeDays: 21, tags: ["high-protein","gluten-free","umami"] },
  // $5.40 / 12 = $0.45/slice
  { id: "ham", name: "Sliced ham", category: "protein", estimatedUnitCost: 0.45, unit: "slice", commonPackageSize: "9 oz deli ham ~$5.40 (~12 slices)", shelfLifeDays: 7, tags: ["high-protein","gluten-free"] },
  // $14.40 / 16 oz = $0.90/oz
  { id: "cod", name: "Cod fillet", category: "protein", estimatedUnitCost: 0.9, unit: "oz", commonPackageSize: "1 lb frozen cod ~$14.40", shelfLifeDays: 180, tags: ["high-protein","gluten-free"] },
  // $8 / 16 oz = $0.50/oz
  { id: "tilapia", name: "Tilapia fillet", category: "protein", estimatedUnitCost: 0.5, unit: "oz", commonPackageSize: "1 lb frozen tilapia ~$8", shelfLifeDays: 180, tags: ["high-protein","gluten-free","cheap"] },
  // $14 / 8 oz = $1.75/oz
  { id: "scallops", name: "Scallops", category: "protein", estimatedUnitCost: 1.75, unit: "oz", commonPackageSize: "8 oz frozen sea scallops ~$14", shelfLifeDays: 180, tags: ["high-protein","gluten-free"] },
  // $8 / 4 oz = $2.00/oz
  { id: "smoked-salmon", name: "Smoked salmon", category: "protein", estimatedUnitCost: 2, unit: "oz", commonPackageSize: "4 oz pack ~$8", shelfLifeDays: 14, tags: ["high-protein","gluten-free","umami"] },
  // $2.40 / 8 oz = $0.30/oz
  { id: "imitation-crab", name: "Imitation crab", category: "protein", estimatedUnitCost: 0.3, unit: "oz", commonPackageSize: "8 oz pack ~$2.40", shelfLifeDays: 14, tags: ["high-protein","cheap"] },
  // $2.50 per 12 oz pack
  { id: "silken-tofu", name: "Silken tofu", category: "protein", estimatedUnitCost: 2.5, unit: "pack", commonPackageSize: "12 oz aseptic pack ~$2.50", shelfLifeDays: 365, tags: ["vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $5.40 / 12 oz = $0.45/oz
  { id: "plant-based-ground", name: "Plant-based ground (Beyond/Impossible)", category: "protein", estimatedUnitCost: 0.45, unit: "oz", commonPackageSize: "12 oz pack ~$5.40", shelfLifeDays: 14, tags: ["vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $3.20 / 16 oz = $0.20/oz
  { id: "peanuts", name: "Peanuts", category: "protein", estimatedUnitCost: 0.2, unit: "oz", commonPackageSize: "16 oz roasted peanuts ~$3.20", shelfLifeDays: 365, tags: ["cheap","vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $6 / 8 oz = $0.75/oz
  { id: "pecans", name: "Pecans", category: "protein", estimatedUnitCost: 0.75, unit: "oz", commonPackageSize: "8 oz bag ~$6", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","dairy-free","baking"] },
  // $11.20 / 16 oz = $0.70/oz
  { id: "pistachios", name: "Pistachios", category: "protein", estimatedUnitCost: 0.7, unit: "oz", commonPackageSize: "16 oz shelled ~$11.20", shelfLifeDays: 365, tags: ["vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $10 / 4 oz = $2.50/oz
  { id: "pine-nuts", name: "Pine nuts", category: "protein", estimatedUnitCost: 2.5, unit: "oz", commonPackageSize: "4 oz bag ~$10", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $4 / 16 oz = $0.25/oz
  { id: "sunflower-seeds", name: "Sunflower seeds", category: "protein", estimatedUnitCost: 0.25, unit: "oz", commonPackageSize: "16 oz bag ~$4", shelfLifeDays: 365, tags: ["cheap","vegan","vegetarian","gluten-free","dairy-free"] },
  // $4 / 8 oz = $0.50/oz
  { id: "pumpkin-seeds", name: "Pumpkin seeds (pepitas)", category: "protein", estimatedUnitCost: 0.5, unit: "oz", commonPackageSize: "8 oz bag ~$4", shelfLifeDays: 365, tags: ["vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $4.80 / 12 oz = $0.40/oz
  { id: "chia-seeds", name: "Chia seeds", category: "protein", estimatedUnitCost: 0.4, unit: "oz", commonPackageSize: "12 oz bag ~$4.80", shelfLifeDays: 730, tags: ["vegan","vegetarian","gluten-free","dairy-free","baking"] },
  // $6.40 / 8 oz = $0.80/oz
  { id: "hemp-seeds", name: "Hemp seeds", category: "protein", estimatedUnitCost: 0.8, unit: "oz", commonPackageSize: "8 oz bag ~$6.40", shelfLifeDays: 365, tags: ["vegan","vegetarian","high-protein","gluten-free","dairy-free"] },

  // ===== Vegetables, herbs, aromatics =====
  // $1.49/lb, ~2 onions per lb, $0.75 each
  { id: "red-onion", name: "Red onion", category: "vegetable", estimatedUnitCost: 0.75, unit: "piece", commonPackageSize: "1 medium red onion (~$0.75)", shelfLifeDays: 30, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.29/lb, ~2 onions per lb, $0.65 each
  { id: "white-onion", name: "White onion", category: "vegetable", estimatedUnitCost: 0.65, unit: "piece", commonPackageSize: "1 medium white onion (~$0.65)", shelfLifeDays: 30, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $2.99/lb, ~1.5 leeks per lb, $1.99 each
  { id: "leek", name: "Leek", category: "vegetable", estimatedUnitCost: 1.99, unit: "piece", commonPackageSize: "1 large leek (~$1.99)", shelfLifeDays: 14, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $2.49/lb, ~1.2 lb per bulb, $2.99 each
  { id: "fennel-bulb", name: "Fennel bulb", category: "vegetable", estimatedUnitCost: 2.99, unit: "piece", commonPackageSize: "1 fennel bulb (~$2.99)", shelfLifeDays: 10, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.79/lb, ~2 lb per head, $3.49 each
  { id: "napa-cabbage", name: "Napa cabbage", category: "vegetable", estimatedUnitCost: 3.49, unit: "piece", commonPackageSize: "1 small head (~2 lb, $3.49)", shelfLifeDays: 14, tags: ["vegetarian","vegan","gluten-free","dairy-free","cheap"] },
  // $1.99/lb, ~1 lb per head, $1.99 each
  { id: "bok-choy", name: "Bok choy", category: "vegetable", estimatedUnitCost: 1.99, unit: "piece", commonPackageSize: "1 head bok choy (~$1.99)", shelfLifeDays: 7, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $3.49 per 8oz bag, ~3 cups, $1.16/cup
  { id: "snap-peas", name: "Snap peas", category: "vegetable", estimatedUnitCost: 3.49, unit: "cup", commonPackageSize: "8 oz bag (~$3.49, ~3 cups)", shelfLifeDays: 7, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $3.99/lb bunch, ~15 spears per bunch
  { id: "asparagus", name: "Asparagus", category: "vegetable", estimatedUnitCost: 3.99, unit: "bag", commonPackageSize: "1 lb bunch (~$3.99)", shelfLifeDays: 5, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $3.49/lb bag, ~4 cups, $0.87/cup
  { id: "brussels-sprouts", name: "Brussels sprouts", category: "vegetable", estimatedUnitCost: 3.49, unit: "cup", commonPackageSize: "1 lb bag (~$3.49, ~4 cups)", shelfLifeDays: 14, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $2.25/lb, ~2 lb per head, $4.49 each
  { id: "cauliflower", name: "Cauliflower", category: "vegetable", estimatedUnitCost: 4.49, unit: "piece", commonPackageSize: "1 head (~2 lb, $4.49)", shelfLifeDays: 10, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.99/lb, ~1.25 lb per eggplant, $2.49 each
  { id: "eggplant", name: "Eggplant", category: "vegetable", estimatedUnitCost: 2.49, unit: "piece", commonPackageSize: "1 globe eggplant (~$2.49)", shelfLifeDays: 7, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.99/lb, ~2 lb per squash, $3.99 each
  { id: "butternut-squash", name: "Butternut squash", category: "vegetable", estimatedUnitCost: 3.99, unit: "piece", commonPackageSize: "1 medium squash (~2 lb, $3.99)", shelfLifeDays: 60, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.49/lb, ~3 lb per squash, $4.49 each
  { id: "spaghetti-squash", name: "Spaghetti squash", category: "vegetable", estimatedUnitCost: 4.49, unit: "piece", commonPackageSize: "1 medium squash (~3 lb, $4.49)", shelfLifeDays: 60, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.69/lb, ~1.5 lb per daikon, $2.49 each
  { id: "daikon", name: "Daikon radish", category: "vegetable", estimatedUnitCost: 2.49, unit: "piece", commonPackageSize: "1 daikon (~1.5 lb, $2.49)", shelfLifeDays: 21, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.99 per bunch, ~10 radishes per bunch
  { id: "radish", name: "Radish", category: "vegetable", estimatedUnitCost: 1.99, unit: "bag", commonPackageSize: "1 bunch / 6 oz bag (~$1.99)", shelfLifeDays: 14, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $2.49/lb, ~2 beets per lb, $1.25 each
  { id: "beet", name: "Beet", category: "vegetable", estimatedUnitCost: 1.25, unit: "piece", commonPackageSize: "1 medium beet (~$1.25)", shelfLifeDays: 21, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $0.79/lb, ~1.25 lb per plantain, $0.99 each
  { id: "plantain", name: "Plantain", category: "vegetable", estimatedUnitCost: 0.99, unit: "piece", commonPackageSize: "1 plantain (~$0.99)", shelfLifeDays: 10, tags: ["vegetarian","vegan","gluten-free","dairy-free","cheap"] },
  // $3.99/lb, ~3.5 cups, $1.14/cup
  { id: "okra", name: "Okra", category: "vegetable", estimatedUnitCost: 3.99, unit: "cup", commonPackageSize: "1 lb fresh (~$3.99, ~3.5 cups)", shelfLifeDays: 5, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $3.99 per 5oz clamshell, ~5 cups
  { id: "arugula", name: "Arugula", category: "vegetable", estimatedUnitCost: 3.99, unit: "bag", commonPackageSize: "5 oz clamshell (~$3.99)", shelfLifeDays: 5, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $4.49 per 5oz clamshell, ~5 cups mixed greens
  { id: "spring-mix", name: "Spring mix", category: "vegetable", estimatedUnitCost: 4.49, unit: "bag", commonPackageSize: "5 oz clamshell (~$4.49)", shelfLifeDays: 5, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $3.49 per 3-pack hearts, $1.16 per heart
  { id: "romaine", name: "Romaine lettuce", category: "vegetable", estimatedUnitCost: 3.49, unit: "bag", commonPackageSize: "3-pack romaine hearts (~$3.49)", shelfLifeDays: 10, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $4.99 per 3.5oz pack, ~3 cups sliced, $1.66/cup
  { id: "shiitake", name: "Shiitake mushrooms", category: "vegetable", estimatedUnitCost: 4.99, unit: "cup", commonPackageSize: "3.5 oz pack (~$4.99, ~3 cups sliced)", shelfLifeDays: 7, tags: ["vegetarian","vegan","gluten-free","dairy-free","umami"] },
  // $3.49 per 8oz pack, ~3 cups sliced, $1.16/cup
  { id: "cremini", name: "Cremini mushrooms", category: "vegetable", estimatedUnitCost: 3.49, unit: "cup", commonPackageSize: "8 oz pack (~$3.49, ~3 cups sliced)", shelfLifeDays: 7, tags: ["vegetarian","vegan","gluten-free","dairy-free","umami"] },
  // $4.99 per 2-pack, $2.50 per cap
  { id: "portobello", name: "Portobello mushrooms", category: "vegetable", estimatedUnitCost: 4.99, unit: "piece", commonPackageSize: "2-pack caps (~$4.99)", shelfLifeDays: 7, tags: ["vegetarian","vegan","gluten-free","dairy-free","umami"] },
  // $2.49 per 0.5oz pack, ~6 tbsp, $0.42/tbsp
  { id: "chives", name: "Chives", category: "vegetable", estimatedUnitCost: 2.49, unit: "tbsp", commonPackageSize: "0.5 oz pack (~$2.49, ~6 tbsp chopped)", shelfLifeDays: 10, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $2.49 per 0.75oz pack, ~1 cup leaves
  { id: "thai-basil", name: "Thai basil", category: "vegetable", estimatedUnitCost: 2.49, unit: "bag", commonPackageSize: "0.75 oz pack (~$2.49)", shelfLifeDays: 5, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $1.49 per stalk, ~1 tbsp minced per stalk
  { id: "lemongrass", name: "Lemongrass", category: "vegetable", estimatedUnitCost: 1.49, unit: "piece", commonPackageSize: "1 stalk (~$1.49)", shelfLifeDays: 14, tags: ["vegetarian","vegan","gluten-free","dairy-free"] },
  // $0.79 per ear, ~3/4 cup kernels per ear
  { id: "sweet-corn", name: "Sweet corn", category: "vegetable", estimatedUnitCost: 0.79, unit: "piece", commonPackageSize: "1 ear corn (~$0.79)", shelfLifeDays: 5, tags: ["vegetarian","vegan","gluten-free","dairy-free","cheap"] },

  // ===== Fruits + juices =====
  // $1.99/lb, ~0.5 lb per pear = $0.95/piece
  { id: "pear", name: "Pear", category: "fruit", estimatedUnitCost: 0.95, unit: "piece", commonPackageSize: "Single pear ~6 oz (~$0.95)", shelfLifeDays: 10, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $2.49/lb, ~0.33 lb per peach = $0.85/piece
  { id: "peach", name: "Peach", category: "fruit", estimatedUnitCost: 0.85, unit: "piece", commonPackageSize: "Single peach ~5 oz (~$0.85)", shelfLifeDays: 7, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $5.99/lb, ~4 half-cups per lb = $1.50/cup, $0.75/half-cup
  { id: "cherry-fresh", name: "Fresh cherries", category: "fruit", estimatedUnitCost: 0.75, unit: "1/2 cup", commonPackageSize: "1 lb bag (~$5.99)", shelfLifeDays: 7, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $5.99 for 10 lb yields ~12 cups cubed = ~$0.50/cup
  { id: "watermelon", name: "Watermelon", category: "fruit", estimatedUnitCost: 0.5, unit: "cup", commonPackageSize: "Whole watermelon ~10 lb (~$5.99)", shelfLifeDays: 10, tags: ["vegan","vegetarian","gluten-free","dairy-free","cheap"] },
  // $3.99 melon yields ~6 cups cubed = ~$0.66/cup, rounded $0.60
  { id: "cantaloupe", name: "Cantaloupe", category: "fruit", estimatedUnitCost: 0.6, unit: "cup", commonPackageSize: "Whole melon ~3 lb (~$3.99)", shelfLifeDays: 10, tags: ["vegan","vegetarian","gluten-free","dairy-free","cheap"] },
  // $3.99 pineapple yields ~5-6 cups chunks = ~$0.70/cup
  { id: "pineapple", name: "Pineapple", category: "fruit", estimatedUnitCost: 0.7, unit: "cup", commonPackageSize: "Whole pineapple (~$3.99)", shelfLifeDays: 7, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $1.25 each at typical grocery, ~1 cup diced per mango
  { id: "mango-fresh", name: "Fresh mango", category: "fruit", estimatedUnitCost: 1.25, unit: "piece", commonPackageSize: "Single mango ~12 oz (~$1.25)", shelfLifeDays: 7, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $3.99/lb, ~6 kiwis per lb = $0.65/piece
  { id: "kiwi", name: "Kiwi", category: "fruit", estimatedUnitCost: 0.65, unit: "piece", commonPackageSize: "Single kiwi ~3 oz (~$0.65)", shelfLifeDays: 14, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $2.99 each, yields ~1 cup arils
  { id: "pomegranate", name: "Pomegranate", category: "fruit", estimatedUnitCost: 2.99, unit: "piece", commonPackageSize: "Single pomegranate (~$2.99)", shelfLifeDays: 21, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $7.99 / ~14 dates per tub = ~$0.55/date
  { id: "medjool-dates", name: "Medjool dates", category: "fruit", estimatedUnitCost: 0.55, unit: "piece", commonPackageSize: "12 oz tub (~$7.99)", shelfLifeDays: 180, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $4.99/8 oz, ~11 quarter-cups per bag = ~$0.45/quarter-cup
  { id: "dried-apricot", name: "Dried apricots", category: "fruit", estimatedUnitCost: 0.45, unit: "1/4 cup", commonPackageSize: "8 oz bag (~$4.99)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $3.49/10 oz, ~12 quarter-cups per bag = ~$0.30/quarter-cup
  { id: "dried-cranberry", name: "Dried cranberries", category: "fruit", estimatedUnitCost: 0.3, unit: "1/4 cup", commonPackageSize: "10 oz bag (~$3.49)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $5.49/6 oz, ~6 quarter-cups per bag = ~$0.90/quarter-cup, rounded
  { id: "dried-mango", name: "Dried mango", category: "fruit", estimatedUnitCost: 0.85, unit: "1/4 cup", commonPackageSize: "6 oz bag (~$5.49)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $5.99/18 mandarins = ~$0.33 each at bag rate, $0.50 single-buy avg
  { id: "mandarin", name: "Mandarin orange", category: "fruit", estimatedUnitCost: 0.5, unit: "piece", commonPackageSize: "3 lb bag (~$5.99) ~18 mandarins", shelfLifeDays: 14, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $1.25 each at typical grocery
  { id: "grapefruit", name: "Grapefruit", category: "fruit", estimatedUnitCost: 1.25, unit: "piece", commonPackageSize: "Single grapefruit (~$1.25)", shelfLifeDays: 21, tags: ["vegan","vegetarian","gluten-free","dairy-free","acidic"] },
  // $3.99 per 6 oz clamshell = standard grocery rate
  { id: "raspberries", name: "Raspberries", category: "fruit", estimatedUnitCost: 3.99, unit: "6 oz container", commonPackageSize: "6 oz clamshell (~$3.99)", shelfLifeDays: 4, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $3.49 per 6 oz clamshell = standard grocery rate
  { id: "blackberries", name: "Blackberries", category: "fruit", estimatedUnitCost: 3.49, unit: "6 oz container", commonPackageSize: "6 oz clamshell (~$3.49)", shelfLifeDays: 5, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $4.99 / ~7 cups per 59 oz carton = ~$0.71/cup; store brand $0.40/cup
  { id: "orange-juice", name: "Orange juice", category: "fruit", estimatedUnitCost: 0.4, unit: "cup", commonPackageSize: "59 oz carton (~$4.99)", shelfLifeDays: 30, tags: ["vegan","vegetarian","gluten-free","dairy-free","acidic"] },
  // $4.49 / ~4 cups per 33.8 oz carton = ~$1.10/cup
  { id: "coconut-water", name: "Coconut water", category: "fruit", estimatedUnitCost: 1.1, unit: "cup", commonPackageSize: "33.8 oz carton (~$4.49)", shelfLifeDays: 180, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },

  // ===== Dairy + non-dairy substitutes =====
  // 1 gal $4.00, 16 cups, $0.25/cup
  { id: "whole-milk", name: "Whole milk", category: "dairy", estimatedUnitCost: 0.25, unit: "cup", commonPackageSize: "1 gallon jug (~$4.00)", shelfLifeDays: 14, tags: ["staple","cheap","vegetarian"] },
  // 16 oz pint $4.40, 2 cups, $2.20/cup; per 1/4 cup $0.55
  { id: "heavy-cream", name: "Heavy cream", category: "dairy", estimatedUnitCost: 0.55, unit: "cup", commonPackageSize: "16 oz carton (~$4.40)", shelfLifeDays: 21, tags: ["vegetarian","baking"] },
  // 1 qt $4.80, 16 quarter-cups, $0.30 per 1/4 cup
  { id: "half-and-half", name: "Half and half", category: "dairy", estimatedUnitCost: 0.3, unit: "1/4 cup", commonPackageSize: "1 quart (~$4.80)", shelfLifeDays: 14, tags: ["vegetarian"] },
  // 1 qt $3.50, 4 cups, $0.88/cup
  { id: "buttermilk", name: "Buttermilk", category: "dairy", estimatedUnitCost: 0.35, unit: "cup", commonPackageSize: "1 quart (~$3.50)", shelfLifeDays: 14, tags: ["vegetarian","baking","acidic"] },
  // 12 oz can $2.20, $2.20/can
  { id: "evaporated-milk", name: "Evaporated milk", category: "dairy", estimatedUnitCost: 2.2, unit: "can", commonPackageSize: "12 oz can (~$2.20)", shelfLifeDays: 365, tags: ["vegetarian","baking"] },
  // 14 oz can $3.50, $3.50/can
  { id: "sweetened-condensed-milk", name: "Sweetened condensed milk", category: "dairy", estimatedUnitCost: 3.5, unit: "can", commonPackageSize: "14 oz can (~$3.50)", shelfLifeDays: 365, tags: ["vegetarian","baking"] },
  // 32 oz $5.20, 4 cups, $1.30/cup; per 1/2 cup $0.65
  { id: "plain-yogurt", name: "Plain whole-milk yogurt", category: "dairy", estimatedUnitCost: 0.65, unit: "cup", commonPackageSize: "32 oz tub (~$5.20)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 15 oz $4.75, ~5 half-cups, $0.95 per 1/2 cup
  { id: "ricotta", name: "Ricotta cheese", category: "dairy", estimatedUnitCost: 0.95, unit: "1/2 cup", commonPackageSize: "15 oz tub (~$4.75)", shelfLifeDays: 14, tags: ["vegetarian"] },
  // 8 oz tub $6.50, $6.50 per 8 oz
  { id: "mascarpone", name: "Mascarpone", category: "dairy", estimatedUnitCost: 6.5, unit: "8 oz", commonPackageSize: "8 oz tub (~$6.50)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 8 oz $4.40, $0.55/oz
  { id: "cheddar-block", name: "Sharp cheddar block", category: "dairy", estimatedUnitCost: 0.55, unit: "oz", commonPackageSize: "8 oz block (~$4.40)", shelfLifeDays: 30, tags: ["staple","vegetarian"] },
  // 8 oz pack ~12 slices $4.80, $0.40/slice
  { id: "swiss-cheese", name: "Swiss cheese", category: "dairy", estimatedUnitCost: 0.4, unit: "slice", commonPackageSize: "8 oz sliced (~$4.80)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 7 oz $4.90, $0.70/oz
  { id: "gouda", name: "Gouda", category: "dairy", estimatedUnitCost: 0.7, unit: "oz", commonPackageSize: "7 oz wedge (~$4.90)", shelfLifeDays: 30, tags: ["vegetarian"] },
  // 8 oz wheel $6.50, $6.50 per 8 oz
  { id: "brie", name: "Brie", category: "dairy", estimatedUnitCost: 6.5, unit: "8 oz", commonPackageSize: "8 oz wheel (~$6.50)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 4 oz log $4.50, $4.50 per log
  { id: "goat-cheese", name: "Goat cheese", category: "dairy", estimatedUnitCost: 4.5, unit: "4 oz log", commonPackageSize: "4 oz log (~$4.50)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 10 oz $4.00, $0.40/oz
  { id: "queso-fresco", name: "Queso fresco", category: "dairy", estimatedUnitCost: 0.4, unit: "oz", commonPackageSize: "10 oz round (~$4.00)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 8 oz $3.60, $0.45/oz
  { id: "cotija", name: "Cotija", category: "dairy", estimatedUnitCost: 0.45, unit: "oz", commonPackageSize: "8 oz wedge (~$3.60)", shelfLifeDays: 60, tags: ["vegetarian"] },
  // 8 oz $7.00, $7.00 per block
  { id: "halloumi", name: "Halloumi", category: "dairy", estimatedUnitCost: 7, unit: "8 oz", commonPackageSize: "8 oz block (~$7.00)", shelfLifeDays: 30, tags: ["vegetarian","high-protein"] },
  // 12 oz block $6.00, $6.00 per block
  { id: "paneer", name: "Paneer", category: "dairy", estimatedUnitCost: 6, unit: "12 oz block", commonPackageSize: "12 oz block (~$6.00)", shelfLifeDays: 30, tags: ["vegetarian","high-protein"] },
  // 8 oz pack ~10 slices $5.00, $0.50/slice
  { id: "pepper-jack", name: "Pepper jack", category: "dairy", estimatedUnitCost: 0.5, unit: "slice", commonPackageSize: "8 oz sliced (~$5.00)", shelfLifeDays: 30, tags: ["vegetarian"] },
  // 8 oz pack 10 slices $4.50, $0.45/slice
  { id: "provolone", name: "Provolone", category: "dairy", estimatedUnitCost: 0.45, unit: "slice", commonPackageSize: "8 oz sliced (~$4.50)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 24 slices $6.00, $0.25/slice
  { id: "american-singles", name: "American cheese singles", category: "dairy", estimatedUnitCost: 0.25, unit: "slice", commonPackageSize: "24 slice pack (~$6.00)", shelfLifeDays: 90, tags: ["cheap","vegetarian"] },
  // 64 oz $3.60, 8 cups, $0.45/cup
  { id: "soy-milk", name: "Soy milk (unsweetened)", category: "dairy", estimatedUnitCost: 0.45, unit: "cup", commonPackageSize: "64 oz carton (~$3.60)", shelfLifeDays: 14, tags: ["vegan","vegetarian","dairy-free"] },
  // 16 oz $5.20, ~32 tbsp, $0.16/tbsp
  { id: "plant-butter", name: "Plant-based butter", category: "dairy", estimatedUnitCost: 0.16, unit: "tbsp", commonPackageSize: "16 oz tub (~$5.20)", shelfLifeDays: 60, tags: ["vegan","vegetarian","dairy-free","baking"] },
  // 4 oz $5.40, ~12 tbsp, $0.45/tbsp
  { id: "vegan-parm", name: "Vegan parmesan", category: "dairy", estimatedUnitCost: 0.45, unit: "tbsp", commonPackageSize: "4 oz shaker (~$5.40)", shelfLifeDays: 180, tags: ["vegan","vegetarian","dairy-free","umami"] },
  // 16 oz $4.00, 8 quarter-cups, $0.50 per 1/4 cup
  { id: "liquid-egg-whites", name: "Liquid egg whites", category: "dairy", estimatedUnitCost: 0.5, unit: "1/4 cup", commonPackageSize: "16 oz carton (~$4.00)", shelfLifeDays: 60, tags: ["high-protein","vegetarian","gluten-free"] },

  // ===== Canned / jarred / shelf-stable =====
  // $1.10 per 15 oz can
  { id: "pinto-beans", name: "Pinto beans (canned)", category: "canned", estimatedUnitCost: 1.1, unit: "can", commonPackageSize: "15 oz can ~$1.10", shelfLifeDays: 730, tags: ["staple","cheap","vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $1.35 per 15 oz can
  { id: "cannellini-beans", name: "Cannellini beans (canned)", category: "canned", estimatedUnitCost: 1.35, unit: "can", commonPackageSize: "15 oz can ~$1.35", shelfLifeDays: 730, tags: ["cheap","vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $1.20 per 15 oz can
  { id: "black-eyed-peas", name: "Black-eyed peas (canned)", category: "canned", estimatedUnitCost: 1.2, unit: "can", commonPackageSize: "15 oz can ~$1.20", shelfLifeDays: 730, tags: ["cheap","vegan","vegetarian","high-protein","gluten-free","dairy-free"] },
  // $2.99/24 oz jar = ~6 half-cup servings = ~$0.50/half-cup
  { id: "applesauce", name: "Applesauce", category: "canned", estimatedUnitCost: 0.5, unit: "1/2 cup", commonPackageSize: "24 oz jar (~$2.99)", shelfLifeDays: 730, tags: ["vegan","vegetarian","gluten-free","dairy-free","baking","cheap"] },
  // 15 oz can $1.35, ~1.75 cups drained, $0.77/cup
  { id: "navy-beans-canned", name: "Navy beans (canned)", category: "canned", estimatedUnitCost: 1.35, unit: "can", commonPackageSize: "15 oz can (~$1.35)", shelfLifeDays: 730, tags: ["vegan","vegetarian","high-protein","gluten-free"] },
  // Bush's 16 oz $1.85, ~2 cups, $0.93/cup
  { id: "baked-beans", name: "Vegetarian baked beans", category: "canned", estimatedUnitCost: 1.85, unit: "can", commonPackageSize: "16 oz can (~$1.85)", shelfLifeDays: 730, tags: ["vegetarian","cheap"] },
  // 32 oz jar $3.50, ~16 (2 tbsp) servings, $0.22/serving
  { id: "sauerkraut", name: "Sauerkraut (jarred)", category: "canned", estimatedUnitCost: 3.5, unit: "jar", commonPackageSize: "32 oz jar (~$3.50)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","acidic","cheap"] },
  // 24 oz jar $3.95, ~12 spears, $0.33/spear
  { id: "dill-pickles", name: "Dill pickles (jarred)", category: "canned", estimatedUnitCost: 3.95, unit: "jar", commonPackageSize: "24 oz jar (~$3.95)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","acidic"] },
  // 12 oz jar $2.75, ~24 tbsp slices, $0.11/tbsp
  { id: "pickled-jalapenos", name: "Pickled jalapenos", category: "canned", estimatedUnitCost: 2.75, unit: "jar", commonPackageSize: "12 oz jar (~$2.75)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","acidic","cheap"] },
  // 3.5 oz jar $3.25, ~14 tsp drained, $0.23/tsp
  { id: "capers", name: "Capers (jarred)", category: "canned", estimatedUnitCost: 3.25, unit: "jar", commonPackageSize: "3.5 oz jar (~$3.25)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","acidic","umami"] },
  // 7 oz jar pimento-stuffed $3.50, ~1 cup, $0.22/2 tbsp serving
  { id: "green-olives", name: "Green olives (jarred)", category: "canned", estimatedUnitCost: 3.5, unit: "jar", commonPackageSize: "7 oz jar (~$3.50)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","umami"] },
  // 8 oz pitted $4.95, ~1 cup, $0.62/2 tbsp serving
  { id: "kalamata-olives", name: "Kalamata olives (jarred)", category: "canned", estimatedUnitCost: 4.95, unit: "jar", commonPackageSize: "8 oz jar (~$4.95)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","umami"] },
  // 12 oz marinated jar $3.95, ~1.5 cups drained, $2.63/cup
  { id: "artichoke-hearts", name: "Marinated artichoke hearts", category: "canned", estimatedUnitCost: 3.95, unit: "jar", commonPackageSize: "12 oz jar (~$3.95)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","umami"] },
  // 8.5 oz in oil $4.50, ~1 cup, $0.56/2 tbsp serving
  { id: "sun-dried-tomatoes", name: "Sun-dried tomatoes (jarred in oil)", category: "canned", estimatedUnitCost: 4.5, unit: "jar", commonPackageSize: "8.5 oz jar (~$4.50)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","umami"] },
  // 12 oz jar $3.25, ~1.5 cups drained, $2.17/cup
  { id: "roasted-red-peppers", name: "Roasted red peppers (jarred)", category: "canned", estimatedUnitCost: 3.25, unit: "jar", commonPackageSize: "12 oz jar (~$3.25)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","umami"] },
  // 16 oz jar $3.50, ~20 peppers, $0.18/pepper
  { id: "pepperoncini", name: "Pepperoncini (jarred)", category: "canned", estimatedUnitCost: 3.5, unit: "jar", commonPackageSize: "16 oz jar (~$3.50)", shelfLifeDays: 540, tags: ["vegan","vegetarian","gluten-free","acidic","cheap"] },
  // 2 oz tin $2.95, ~10 fillets, $0.30/fillet
  { id: "anchovies-canned", name: "Anchovies in olive oil (canned)", category: "canned", estimatedUnitCost: 2.95, unit: "can", commonPackageSize: "2 oz tin (~$2.95)", shelfLifeDays: 730, tags: ["high-protein","gluten-free","umami"] },
  // 4.4 oz can $2.65, ~1 serving
  { id: "mackerel-canned", name: "Mackerel (canned)", category: "canned", estimatedUnitCost: 2.65, unit: "can", commonPackageSize: "4.4 oz can (~$2.65)", shelfLifeDays: 1095, tags: ["high-protein","gluten-free","dairy-free"] },
  // 6.5 oz can chopped $2.95, ~1 cup with juice
  { id: "clams-canned", name: "Clams (canned)", category: "canned", estimatedUnitCost: 2.95, unit: "can", commonPackageSize: "6.5 oz can (~$2.95)", shelfLifeDays: 1095, tags: ["high-protein","gluten-free","dairy-free","umami"] },
  // 6 oz lump can $4.50, ~1 cup picked, $4.50/cup
  { id: "crab-canned", name: "Crab meat (canned)", category: "canned", estimatedUnitCost: 4.5, unit: "can", commonPackageSize: "6 oz can (~$4.50)", shelfLifeDays: 730, tags: ["high-protein","gluten-free","dairy-free"] },
  // 15 oz Libby's $2.45, ~1.75 cups, $1.40/cup
  { id: "pumpkin-puree", name: "Pumpkin puree (canned)", category: "canned", estimatedUnitCost: 2.45, unit: "can", commonPackageSize: "15 oz can (~$2.45)", shelfLifeDays: 730, tags: ["vegan","vegetarian","gluten-free","baking"] },
  // 8 oz sliced can $1.85, ~1 cup drained, $1.85/cup
  { id: "water-chestnuts", name: "Water chestnuts (canned)", category: "canned", estimatedUnitCost: 1.85, unit: "can", commonPackageSize: "8 oz can (~$1.85)", shelfLifeDays: 1095, tags: ["vegan","vegetarian","gluten-free","cheap"] },
  // 8 oz sliced can $2.25, ~1 cup drained, $2.25/cup
  { id: "bamboo-shoots", name: "Bamboo shoots (canned)", category: "canned", estimatedUnitCost: 2.25, unit: "can", commonPackageSize: "8 oz can (~$2.25)", shelfLifeDays: 1095, tags: ["vegan","vegetarian","gluten-free"] },
  // 14 oz can $3.75, ~1.5 cups sliced drained, $2.50/cup
  { id: "hearts-of-palm", name: "Hearts of palm (canned)", category: "canned", estimatedUnitCost: 3.75, unit: "can", commonPackageSize: "14 oz can (~$3.75)", shelfLifeDays: 1095, tags: ["vegan","vegetarian","gluten-free"] },
  // 20 oz young green jackfruit $3.25, ~2 cups shredded, $1.63/cup
  { id: "jackfruit-canned", name: "Jackfruit in brine (canned)", category: "canned", estimatedUnitCost: 3.25, unit: "can", commonPackageSize: "20 oz can (~$3.25)", shelfLifeDays: 730, tags: ["vegan","vegetarian","gluten-free"] },
  // 13.5 oz can $2.95, ~1.5 cups, $1.97/cup
  { id: "coconut-cream", name: "Coconut cream (canned)", category: "canned", estimatedUnitCost: 2.95, unit: "can", commonPackageSize: "13.5 oz can (~$2.95)", shelfLifeDays: 730, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // 29 oz can $2 = $2/can
  { id: "hominy-canned", name: "Hominy (canned)", category: "canned", estimatedUnitCost: 2, unit: "can", commonPackageSize: "29 oz can (~$2)", shelfLifeDays: 1095, tags: ["vegan","gluten-free"] },

  // ===== Condiments, sauces, oils, vinegars =====
  // $2.49/8 oz bottle = 16 tbsp = ~$0.15/tbsp
  { id: "lemon-juice-bottled", name: "Bottled lemon juice", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "8 oz bottle (~$2.49)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","dairy-free","acidic","staple"] },
  // $2.49/8 oz bottle = 16 tbsp = ~$0.15/tbsp
  { id: "lime-juice-bottled", name: "Bottled lime juice", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "8 oz bottle (~$2.49)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free","dairy-free","acidic","staple"] },
  // 16 oz bottle $4.50, ~32 tbsp/bottle = $0.14/tbsp; mid-tier $0.18
  { id: "caesar-dressing", name: "Caesar dressing", category: "condiment", estimatedUnitCost: 0.18, unit: "tbsp", commonPackageSize: "16 oz bottle (~$4.50)", shelfLifeDays: 180, tags: ["vegetarian"] },
  // 16 oz $3.80, ~32 tbsp = $0.12/tbsp
  { id: "italian-dressing", name: "Italian dressing", category: "condiment", estimatedUnitCost: 0.12, unit: "tbsp", commonPackageSize: "16 oz bottle (~$3.80)", shelfLifeDays: 270, tags: ["vegetarian","acidic"] },
  // 14 oz $4.20, ~28 tbsp = $0.15/tbsp
  { id: "balsamic-vinaigrette", name: "Balsamic vinaigrette", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "14 oz bottle (~$4.20)", shelfLifeDays: 270, tags: ["vegan","vegetarian","acidic"] },
  // 16 oz $5.00, ~32 tbsp = $0.16/tbsp; rounded $0.20
  { id: "blue-cheese-dressing", name: "Blue cheese dressing", category: "condiment", estimatedUnitCost: 0.2, unit: "tbsp", commonPackageSize: "16 oz bottle (~$5.00)", shelfLifeDays: 90, tags: ["vegetarian"] },
  // 16 oz $4.00, ~32 tbsp = $0.13/tbsp; rounded $0.14
  { id: "thousand-island", name: "Thousand island dressing", category: "condiment", estimatedUnitCost: 0.14, unit: "tbsp", commonPackageSize: "16 oz bottle (~$4.00)", shelfLifeDays: 180, tags: ["vegetarian"] },
  // 12 oz jar $7.50, ~24 tbsp = $0.31/tbsp; rounded $0.45 mid-tier
  { id: "chimichurri", name: "Chimichurri sauce", category: "condiment", estimatedUnitCost: 0.45, unit: "tbsp", commonPackageSize: "12 oz jar (~$7.50)", shelfLifeDays: 120, tags: ["vegan","vegetarian","acidic"] },
  // 8 oz jar $8.50, ~16 tbsp = $0.53/tbsp; rounded $0.55
  { id: "salsa-macha", name: "Salsa macha", category: "condiment", estimatedUnitCost: 0.55, unit: "tbsp", commonPackageSize: "8 oz jar (~$8.50)", shelfLifeDays: 180, tags: ["vegan","vegetarian","umami"] },
  // 8 oz jar $7.00, ~16 tbsp = $0.44/tbsp; rounded $0.50
  { id: "romesco", name: "Romesco sauce", category: "condiment", estimatedUnitCost: 0.5, unit: "tbsp", commonPackageSize: "8 oz jar (~$7.00)", shelfLifeDays: 120, tags: ["vegan","vegetarian","umami"] },
  // 12 oz tub $5.00, ~24 tbsp = $0.21/tbsp; rounded $0.30
  { id: "tzatziki", name: "Tzatziki sauce", category: "condiment", estimatedUnitCost: 0.3, unit: "tbsp", commonPackageSize: "12 oz tub (~$5.00)", shelfLifeDays: 21, tags: ["vegetarian"] },
  // 11 oz $5.50, ~22 tbsp = $0.25/tbsp; rounded $0.35
  { id: "peanut-sauce", name: "Peanut sauce", category: "condiment", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "11 oz jar (~$5.50)", shelfLifeDays: 270, tags: ["vegan","vegetarian"] },
  // 12 oz $4.00, ~24 tbsp = $0.17/tbsp; rounded $0.18
  { id: "sweet-chili-sauce", name: "Sweet chili sauce", category: "condiment", estimatedUnitCost: 0.18, unit: "tbsp", commonPackageSize: "12 oz bottle (~$4.00)", shelfLifeDays: 540, tags: ["vegan","vegetarian"] },
  // 10 oz $4.00, ~20 tbsp = $0.20/tbsp
  { id: "plum-sauce", name: "Plum sauce", category: "condiment", estimatedUnitCost: 0.2, unit: "tbsp", commonPackageSize: "10 oz bottle (~$4.00)", shelfLifeDays: 540, tags: ["vegan","vegetarian"] },
  // 7.8 oz jar $12.00, ~15 tbsp = $0.80/tbsp; rounded $0.85
  { id: "xo-sauce", name: "XO sauce", category: "condiment", estimatedUnitCost: 0.85, unit: "tbsp", commonPackageSize: "7.8 oz jar (~$12.00)", shelfLifeDays: 365, tags: ["umami"] },
  // 8 oz $3.80, ~16 tbsp; budget brand $0.18/tbsp
  { id: "black-bean-sauce", name: "Chinese black bean sauce", category: "condiment", estimatedUnitCost: 0.18, unit: "tbsp", commonPackageSize: "8 oz jar (~$3.80)", shelfLifeDays: 720, tags: ["vegan","vegetarian","umami"] },
  // 8 oz jar $3.50, ~16 tbsp = $0.22/tbsp
  { id: "sambal-oelek", name: "Sambal oelek", category: "condiment", estimatedUnitCost: 0.2, unit: "tbsp", commonPackageSize: "8 oz jar (~$3.50)", shelfLifeDays: 540, tags: ["vegan","staple"] },
  // 1.7 oz jar $9.50, ~10 tsp = $0.95/tsp; rounded $1.20 specialty
  { id: "yuzu-kosho", name: "Yuzu kosho", category: "condiment", estimatedUnitCost: 1.2, unit: "tsp", commonPackageSize: "1.7 oz jar (~$9.50)", shelfLifeDays: 365, tags: ["vegan","vegetarian","acidic"] },
  // 7 oz can $2.50 = $2.50/can
  { id: "chipotle-in-adobo", name: "Chipotle peppers in adobo", category: "condiment", estimatedUnitCost: 2.5, unit: "can", commonPackageSize: "7 oz can (~$2.50)", shelfLifeDays: 1095, tags: ["vegan","vegetarian","umami"] },
  // 13.4 oz $5.50, ~22 tbsp = $0.25/tbsp; rounded $0.35
  { id: "dulce-de-leche", name: "Dulce de leche", category: "condiment", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "13.4 oz jar (~$5.50)", shelfLifeDays: 365, tags: ["vegetarian","baking"] },
  // 10 oz $5.50, ~20 tbsp = $0.28/tbsp; rounded $0.40
  { id: "lemon-curd", name: "Lemon curd", category: "condiment", estimatedUnitCost: 0.4, unit: "tbsp", commonPackageSize: "10 oz jar (~$5.50)", shelfLifeDays: 365, tags: ["vegetarian","baking","acidic"] },
  // 12 oz $4.50, ~24 tbsp = $0.19/tbsp; rounded $0.22
  { id: "marmalade", name: "Orange marmalade", category: "condiment", estimatedUnitCost: 0.22, unit: "tbsp", commonPackageSize: "12 oz jar (~$4.50)", shelfLifeDays: 540, tags: ["vegan","vegetarian"] },
  // 14 oz $5.00, ~28 tbsp = $0.18/tbsp; rounded $0.25
  { id: "apple-butter", name: "Apple butter", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "14 oz jar (~$5.00)", shelfLifeDays: 365, tags: ["vegan","vegetarian"] },
  // 14 oz $4.50, ~28 tbsp; brand premium $0.30/tbsp
  { id: "cookie-butter", name: "Cookie butter (Biscoff spread)", category: "condiment", estimatedUnitCost: 0.3, unit: "tbsp", commonPackageSize: "14 oz jar (~$4.50)", shelfLifeDays: 365, tags: ["vegan","vegetarian","baking"] },
  // 24 oz bottle $4.50, ~48 tbsp = $0.09/tbsp; rounded $0.15
  { id: "chocolate-syrup", name: "Chocolate syrup", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "24 oz bottle (~$4.50)", shelfLifeDays: 730, tags: ["vegan","vegetarian","baking"] },
  // 12.25 oz $4.50, ~24 tbsp = $0.19/tbsp; rounded $0.25
  { id: "caramel-sauce", name: "Caramel sauce", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "12.25 oz jar (~$4.50)", shelfLifeDays: 365, tags: ["vegetarian","baking"] },
  // 17 oz $3.50, ~34 tbsp = $0.10/tbsp
  { id: "white-wine-vinegar", name: "White wine vinegar", category: "condiment", estimatedUnitCost: 0.1, unit: "tbsp", commonPackageSize: "16.9 oz bottle (~$3.50)", shelfLifeDays: 1095, tags: ["vegan","vegetarian","acidic"] },
  // 12.7 oz $7.50, ~25 tbsp = $0.30/tbsp
  { id: "sherry-vinegar", name: "Sherry vinegar", category: "condiment", estimatedUnitCost: 0.3, unit: "tbsp", commonPackageSize: "12.7 oz bottle (~$7.50)", shelfLifeDays: 1095, tags: ["vegan","vegetarian","acidic"] },
  // 24 oz $6.50, ~48 tbsp = $0.14/tbsp
  { id: "peanut-oil", name: "Peanut oil", category: "condiment", estimatedUnitCost: 0.14, unit: "tbsp", commonPackageSize: "24 oz bottle (~$6.50)", shelfLifeDays: 540, tags: ["vegan","vegetarian"] },
  // 17 oz $7.00, ~34 tbsp = $0.21/tbsp
  { id: "grapeseed-oil", name: "Grapeseed oil", category: "condiment", estimatedUnitCost: 0.21, unit: "tbsp", commonPackageSize: "16.9 oz bottle (~$7.00)", shelfLifeDays: 365, tags: ["vegan","vegetarian"] },
  // 1.86 oz bottle $15.00, ~11 tsp = $1.36/tsp; rounded $1.50
  { id: "truffle-oil", name: "Truffle oil", category: "condiment", estimatedUnitCost: 1.5, unit: "tsp", commonPackageSize: "1.86 oz bottle (~$15.00)", shelfLifeDays: 365, tags: ["vegan","vegetarian","umami"] },
  // 10 sheets per $2.50 pack = $0.25/sheet
  { id: "nori-sheets", name: "Nori sheets", category: "condiment", estimatedUnitCost: 0.25, unit: "sheet", commonPackageSize: "10 sheet pack (~$2.50)", shelfLifeDays: 365, tags: ["umami","vegan"] },
  // 10 packets per $5 box = $0.50/packet
  { id: "dashi-packet", name: "Dashi packet", category: "condiment", estimatedUnitCost: 0.5, unit: "packet", commonPackageSize: "10 packet box (~$5)", shelfLifeDays: 540, tags: ["umami"] },
  // 12 oz bottle $4.50, ~24 tbsp = $0.19/tbsp
  { id: "sushi-vinegar", name: "Sushi vinegar", category: "condiment", estimatedUnitCost: 0.19, unit: "tbsp", commonPackageSize: "12 oz bottle (~$4.50)", shelfLifeDays: 730, tags: ["acidic","vegan"] },
  // 20 oz bottle $8, ~32 tbsp = $0.25/tbsp
  { id: "kecap-manis", name: "Kecap manis (sweet soy)", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "20 oz bottle (~$8)", shelfLifeDays: 730, tags: ["umami","vegan"] },
  // 17 oz tub $7, ~20 tbsp usable = $0.35/tbsp
  { id: "ssamjang", name: "Ssamjang", category: "condiment", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "17 oz tub (~$7)", shelfLifeDays: 365, tags: ["umami","vegan"] },
  // 8 oz jar $5, ~16 tbsp = $0.31/tbsp
  { id: "tamarind-paste", name: "Tamarind paste", category: "condiment", estimatedUnitCost: 0.31, unit: "tbsp", commonPackageSize: "8 oz jar (~$5)", shelfLifeDays: 540, tags: ["acidic","vegan"] },
  // 16 oz $6, ~15 tbsp packed = $0.40/tbsp
  { id: "palm-sugar", name: "Palm sugar", category: "condiment", estimatedUnitCost: 0.4, unit: "tbsp", commonPackageSize: "16 oz pack (~$6)", shelfLifeDays: 1095, tags: ["vegan"] },
  // 10 oz bottle $6, ~20 tbsp = $0.30/tbsp
  { id: "pomegranate-molasses", name: "Pomegranate molasses", category: "condiment", estimatedUnitCost: 0.3, unit: "tbsp", commonPackageSize: "10 oz bottle (~$6)", shelfLifeDays: 730, tags: ["acidic","vegan"] },
  // 12 oz bottle $7, ~20 tbsp = $0.35/tbsp
  { id: "date-syrup", name: "Date syrup", category: "condiment", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "12 oz bottle (~$7)", shelfLifeDays: 730, tags: ["vegan"] },
  // 10 oz jar $5, ~16 tbsp = $0.31/tbsp
  { id: "mango-pickle", name: "Mango pickle (achar)", category: "condiment", estimatedUnitCost: 0.31, unit: "tbsp", commonPackageSize: "10 oz jar (~$5)", shelfLifeDays: 540, tags: ["vegan","acidic"] },
  // 12 oz jar $5, ~12 tbsp = $0.42/tbsp
  { id: "sofrito", name: "Sofrito", category: "condiment", estimatedUnitCost: 0.42, unit: "tbsp", commonPackageSize: "12 oz jar (~$5)", shelfLifeDays: 180, tags: ["vegan"] },
  // 6.7 oz $6, ~40 tsp = $0.15/tsp
  { id: "maggi-seasoning", name: "Maggi seasoning", category: "condiment", estimatedUnitCost: 0.15, unit: "tsp", commonPackageSize: "6.7 oz bottle (~$6)", shelfLifeDays: 1095, tags: ["umami","staple"] },
  // 8.25 oz jar $6, ~12 tbsp = $0.50/tbsp
  { id: "mole-sauce", name: "Mole sauce", category: "condiment", estimatedUnitCost: 0.5, unit: "tbsp", commonPackageSize: "8.25 oz jar (~$6)", shelfLifeDays: 540, tags: ["vegan"] },
  // 12 oz $3.50, ~24 tbsp = $0.15/tbsp
  { id: "banana-ketchup", name: "Banana ketchup", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "12 oz bottle (~$3.50)", shelfLifeDays: 365, tags: ["vegan"] },

  // ===== Spices, blends, baking =====
  // 3 lb box $5, ~864 tsp, ~$0.006/tsp rounded to $0.01
  { id: "kosher-salt", name: "Kosher salt", category: "spice", estimatedUnitCost: 0.01, unit: "tsp", commonPackageSize: "3 lb box (~$5.00)", shelfLifeDays: 1095, tags: ["staple","cheap","vegan","gluten-free","dairy-free"] },
  // 8.5 oz tin $8.50, ~85 tsp finishing salt, $0.10/tsp
  { id: "flaky-sea-salt", name: "Flaky sea salt (Maldon-style)", category: "spice", estimatedUnitCost: 0.1, unit: "tsp", commonPackageSize: "8.5 oz tin (~$8.50)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 2.5 oz jar $3.50, ~50 tsp, $0.07/tsp
  { id: "celery-salt", name: "Celery salt", category: "spice", estimatedUnitCost: 0.07, unit: "tsp", commonPackageSize: "2.5 oz jar (~$3.50)", shelfLifeDays: 730, tags: ["vegan","gluten-free","dairy-free"] },
  // 5 oz jar $4.50, ~85 tsp, $0.05/tsp
  { id: "garlic-salt", name: "Garlic salt", category: "spice", estimatedUnitCost: 0.05, unit: "tsp", commonPackageSize: "5 oz jar (~$4.50)", shelfLifeDays: 730, tags: ["cheap","vegan","gluten-free","dairy-free"] },
  // 1.7 oz jar $4, ~40 tsp, $0.10/tsp
  { id: "fennel-seed", name: "Fennel seed", category: "spice", estimatedUnitCost: 0.1, unit: "tsp", commonPackageSize: "1.7 oz jar (~$4.00)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 2 oz jar $3.50, ~45 tsp, $0.08/tsp
  { id: "mustard-seed", name: "Mustard seed", category: "spice", estimatedUnitCost: 0.08, unit: "tsp", commonPackageSize: "2 oz jar (~$3.50)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 1.8 oz jar $4.50, ~42 tsp, $0.11/tsp
  { id: "caraway-seed", name: "Caraway seed", category: "spice", estimatedUnitCost: 0.11, unit: "tsp", commonPackageSize: "1.8 oz jar (~$4.50)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 1 oz jar $8, ~25 tsp ground, $0.32/tsp rounded $0.30
  { id: "cardamom-green", name: "Green cardamom", category: "spice", estimatedUnitCost: 0.3, unit: "tsp", commonPackageSize: "1 oz jar (~$8.00)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free","baking"] },
  // $4.50 / 30 pods = $0.15/pod
  { id: "star-anise", name: "Star anise", category: "spice", estimatedUnitCost: 0.15, unit: "piece", commonPackageSize: "1 oz bag (~$4.50, ~30 pods)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 2 oz jar $3, ~45 tsp, $0.07/tsp rounded $0.06
  { id: "fenugreek", name: "Fenugreek seed", category: "spice", estimatedUnitCost: 0.06, unit: "tsp", commonPackageSize: "2 oz jar (~$3.00)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 1 g vial $8, ~7 tsp threads, ~$1.15/tsp rounded $1.20
  { id: "saffron", name: "Saffron threads", category: "spice", estimatedUnitCost: 1.2, unit: "tsp", commonPackageSize: "1 g vial (~$8.00)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 3 oz grinder $5, ~60 tsp, $0.08/tsp
  { id: "whole-peppercorns", name: "Whole black peppercorns", category: "spice", estimatedUnitCost: 0.08, unit: "tsp", commonPackageSize: "3 oz grinder (~$5.00)", shelfLifeDays: 1095, tags: ["staple","vegan","gluten-free","dairy-free"] },
  // 1.5 oz jar $6, ~30 tsp, $0.20/tsp
  { id: "sichuan-peppercorn", name: "Sichuan peppercorn", category: "spice", estimatedUnitCost: 0.2, unit: "tsp", commonPackageSize: "1.5 oz jar (~$6.00)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 2 oz jar $4.50, ~45 tsp, $0.10/tsp
  { id: "chipotle-powder", name: "Chipotle chili powder", category: "spice", estimatedUnitCost: 0.1, unit: "tsp", commonPackageSize: "2 oz jar (~$4.50)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 2 oz jar $4.50, ~45 tsp, $0.10/tsp
  { id: "ancho-chili-powder", name: "Ancho chili powder", category: "spice", estimatedUnitCost: 0.1, unit: "tsp", commonPackageSize: "2 oz jar (~$4.50)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free"] },
  // 5 oz bottle $3.50, ~80 tsp, $0.04/tsp rounded $0.05
  { id: "tajin", name: "Tajin seasoning", category: "spice", estimatedUnitCost: 0.05, unit: "tsp", commonPackageSize: "5 oz bottle (~$3.50)", shelfLifeDays: 730, tags: ["cheap","vegan","gluten-free","dairy-free","acidic"] },
  // 2.5 oz jar $5.50, ~45 tsp, $0.12/tsp
  { id: "jerk-seasoning", name: "Jerk seasoning", category: "spice", estimatedUnitCost: 0.12, unit: "tsp", commonPackageSize: "2.5 oz jar (~$5.50)", shelfLifeDays: 730, tags: ["vegan","gluten-free","dairy-free"] },
  // 2 oz jar $7, ~40 tsp, $0.18/tsp
  { id: "berbere", name: "Berbere spice blend", category: "spice", estimatedUnitCost: 0.18, unit: "tsp", commonPackageSize: "2 oz jar (~$7.00)", shelfLifeDays: 730, tags: ["vegan","gluten-free","dairy-free"] },
  // 2 oz jar $7, ~40 tsp, $0.18/tsp
  { id: "ras-el-hanout", name: "Ras el hanout", category: "spice", estimatedUnitCost: 0.18, unit: "tsp", commonPackageSize: "2 oz jar (~$7.00)", shelfLifeDays: 730, tags: ["vegan","gluten-free","dairy-free"] },
  // 2.5 oz jar $8, ~40 tsp, $0.20/tsp
  { id: "dukkah", name: "Dukkah blend", category: "spice", estimatedUnitCost: 0.2, unit: "tsp", commonPackageSize: "2.5 oz jar (~$8.00)", shelfLifeDays: 365, tags: ["vegan","gluten-free","dairy-free"] },
  // 5 oz jar $3, ~80 tsp, $0.04/tsp
  { id: "adobo-seasoning", name: "Adobo seasoning", category: "spice", estimatedUnitCost: 0.04, unit: "tsp", commonPackageSize: "5 oz jar (~$3.00)", shelfLifeDays: 730, tags: ["cheap","vegan","gluten-free","dairy-free"] },
  // 8 packets $2.50, ~2 tsp/packet = 16 tsp, $0.16/tsp rounded $0.15
  { id: "sazon", name: "Sazon seasoning", category: "spice", estimatedUnitCost: 0.15, unit: "tsp", commonPackageSize: "8 packet box (~$2.50)", shelfLifeDays: 730, tags: ["cheap","vegan","gluten-free","dairy-free"] },
  // 2.2 oz jar $6.50, ~32 tsp, $0.20/tsp
  { id: "dashi-powder", name: "Dashi powder", category: "spice", estimatedUnitCost: 0.2, unit: "tsp", commonPackageSize: "2.2 oz jar (~$6.50)", shelfLifeDays: 730, tags: ["gluten-free","dairy-free","umami"] },
  // 1 oz bag $6, ~15 tbsp loose flakes, $0.40/tbsp
  { id: "bonito-flakes", name: "Bonito flakes", category: "spice", estimatedUnitCost: 0.4, unit: "tbsp", commonPackageSize: "1 oz bag (~$6.00)", shelfLifeDays: 365, tags: ["gluten-free","dairy-free","umami"] },
  // 4 oz jar $6, ~60 tsp, $0.10/tsp
  { id: "instant-yeast", name: "Instant yeast", category: "spice", estimatedUnitCost: 0.1, unit: "tsp", commonPackageSize: "4 oz jar (~$6.00)", shelfLifeDays: 365, tags: ["vegan","dairy-free","baking"] },
  // 1.5 oz jar $4.50, ~30 tsp, $0.15/tsp
  { id: "cream-of-tartar", name: "Cream of tartar", category: "spice", estimatedUnitCost: 0.15, unit: "tsp", commonPackageSize: "1.5 oz jar (~$4.50)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free","baking","acidic"] },
  // 2 oz bottle $6, ~20 tsp, $0.30/tsp
  { id: "almond-extract", name: "Almond extract", category: "spice", estimatedUnitCost: 0.3, unit: "tsp", commonPackageSize: "2 oz bottle (~$6.00)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free","baking"] },
  // 2 oz bottle $5, ~20 tsp, $0.25/tsp
  { id: "peppermint-extract", name: "Peppermint extract", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "2 oz bottle (~$5.00)", shelfLifeDays: 1095, tags: ["vegan","gluten-free","dairy-free","baking"] },
  // 12 oz bag $4, 2 cups = 8 quarter-cups, $0.50/quarter-cup
  { id: "chocolate-chips", name: "Chocolate chips", category: "spice", estimatedUnitCost: 0.5, unit: "1/4 cup", commonPackageSize: "12 oz bag (~$4.00, ~2 cups)", shelfLifeDays: 365, tags: ["vegetarian","gluten-free","baking"] },
  // 4 packets $4.50, ~3.25 tsp/packet = 13 tsp, $0.35/tsp
  { id: "gelatin-powder", name: "Unflavored gelatin", category: "spice", estimatedUnitCost: 0.35, unit: "tsp", commonPackageSize: "1 oz box, 4 packets (~$4.50)", shelfLifeDays: 1095, tags: ["gluten-free","dairy-free","baking","high-protein"] },
  // 2 lb bag $3.50, ~96 tbsp per bag, ~$0.04/tbsp
  { id: "powdered-sugar", name: "Powdered sugar", category: "spice", estimatedUnitCost: 0.04, unit: "tbsp", commonPackageSize: "2 lb bag (~$3.50)", shelfLifeDays: 730, tags: ["baking","cheap"] },
  // 24 oz bag $4.50, ~72 tbsp per bag, ~$0.06/tbsp
  { id: "turbinado-sugar", name: "Turbinado sugar", category: "spice", estimatedUnitCost: 0.06, unit: "tbsp", commonPackageSize: "24 oz bag (~$4.50)", shelfLifeDays: 1095, tags: ["baking"] },
  // 16 oz bag $5.50, ~48 tbsp per bag, ~$0.11/tbsp
  { id: "coconut-sugar", name: "Coconut sugar", category: "spice", estimatedUnitCost: 0.11, unit: "tbsp", commonPackageSize: "16 oz bag (~$5.50)", shelfLifeDays: 1095, tags: ["baking","vegan","vegetarian"] },
  // 8 oz pouch $8.50, ~56 tsp per pouch, ~$0.15/tsp
  { id: "monk-fruit-sweetener", name: "Monk fruit sweetener", category: "spice", estimatedUnitCost: 0.15, unit: "tsp", commonPackageSize: "8 oz pouch (~$8.50)", shelfLifeDays: 1095, tags: ["baking"] },
  // 100 packets $6, 1 packet ~= 1 tsp sugar equiv, ~$0.06/tsp
  { id: "stevia", name: "Stevia sweetener", category: "spice", estimatedUnitCost: 0.06, unit: "tsp", commonPackageSize: "100 packets (~$6.00)", shelfLifeDays: 1095, tags: ["baking"] },
  // 16 oz bag $7, ~54 tbsp per bag, ~$0.13/tbsp
  { id: "erythritol", name: "Erythritol", category: "spice", estimatedUnitCost: 0.13, unit: "tbsp", commonPackageSize: "16 oz bag (~$7.00)", shelfLifeDays: 1095, tags: ["baking"] },
  // 12 oz bag $9, ~50 tbsp per bag, ~$0.18/tbsp
  { id: "allulose", name: "Allulose", category: "spice", estimatedUnitCost: 0.18, unit: "tbsp", commonPackageSize: "12 oz bag (~$9.00)", shelfLifeDays: 730, tags: ["baking"] },
  // 12 oz jar $5, ~24 tbsp per jar, ~$0.21/tbsp
  { id: "molasses", name: "Molasses", category: "spice", estimatedUnitCost: 0.21, unit: "tbsp", commonPackageSize: "12 oz jar (~$5.00)", shelfLifeDays: 730, tags: ["baking","vegan"] },
  // 16 oz bottle $4, ~32 tbsp per bottle, ~$0.13/tbsp
  { id: "corn-syrup", name: "Corn syrup", category: "spice", estimatedUnitCost: 0.13, unit: "tbsp", commonPackageSize: "16 oz bottle (~$4.00)", shelfLifeDays: 1095, tags: ["baking"] },
  // 12 oz bag $4, ~14 tbsp per bag, ~$0.29/tbsp
  { id: "semi-sweet-chocolate-chips", name: "Semi-sweet chocolate chips", category: "spice", estimatedUnitCost: 0.29, unit: "tbsp", commonPackageSize: "12 oz bag (~$4.00)", shelfLifeDays: 365, tags: ["baking","vegetarian"] },
  // 10 oz bag $4.50, ~13 tbsp per bag, ~$0.35/tbsp
  { id: "dark-chocolate-chips", name: "Dark chocolate chips", category: "spice", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "10 oz bag (~$4.50)", shelfLifeDays: 365, tags: ["baking"] },
  // 11 oz bag $4.50, ~14 tbsp per bag, ~$0.32/tbsp
  { id: "white-chocolate-chips", name: "White chocolate chips", category: "spice", estimatedUnitCost: 0.32, unit: "tbsp", commonPackageSize: "11 oz bag (~$4.50)", shelfLifeDays: 365, tags: ["baking","vegetarian"] },
  // 4 oz bar $3.50, $0.88/oz
  { id: "unsweetened-baking-chocolate", name: "Unsweetened baking chocolate", category: "spice", estimatedUnitCost: 0.88, unit: "oz", commonPackageSize: "4 oz bar (~$3.50)", shelfLifeDays: 730, tags: ["baking"] },
  // 8 oz tin $7.50, ~38 tbsp per tin, ~$0.20/tbsp
  { id: "dutch-cocoa", name: "Dutch process cocoa", category: "spice", estimatedUnitCost: 0.2, unit: "tbsp", commonPackageSize: "8 oz tin (~$7.50)", shelfLifeDays: 730, tags: ["baking","vegan"] },
  // 16 oz box $2.50, ~48 tbsp per box, ~$0.05/tbsp
  { id: "cornstarch", name: "Cornstarch", category: "spice", estimatedUnitCost: 0.05, unit: "tbsp", commonPackageSize: "16 oz box (~$2.50)", shelfLifeDays: 1095, tags: ["baking","staple","cheap","gluten-free"] },
  // 16 oz bag $4, ~50 tbsp per bag, ~$0.08/tbsp
  { id: "tapioca-starch", name: "Tapioca starch", category: "spice", estimatedUnitCost: 0.08, unit: "tbsp", commonPackageSize: "16 oz bag (~$4.00)", shelfLifeDays: 1095, tags: ["baking","gluten-free","vegan"] },
  // 16 oz bag $4.50, ~52 tbsp per bag, ~$0.09/tbsp
  { id: "potato-starch", name: "Potato starch", category: "spice", estimatedUnitCost: 0.09, unit: "tbsp", commonPackageSize: "16 oz bag (~$4.50)", shelfLifeDays: 1095, tags: ["baking","gluten-free","vegan"] },
  // 8 oz bag $4.50, ~26 tbsp per bag, ~$0.17/tbsp
  { id: "unsweetened-shredded-coconut", name: "Unsweetened shredded coconut", category: "spice", estimatedUnitCost: 0.17, unit: "tbsp", commonPackageSize: "8 oz bag (~$4.50)", shelfLifeDays: 365, tags: ["baking","vegan","gluten-free"] },
  // 1 oz bag $3, ~20 tbsp loose = $0.15/tbsp
  { id: "kasoori-methi", name: "Kasoori methi (dried fenugreek)", category: "spice", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "1 oz bag (~$3)", shelfLifeDays: 730, tags: ["vegan"] },
  // 0.5 oz $4 dried, ~40 tbsp loose = $0.10/tbsp
  { id: "curry-leaves", name: "Curry leaves", category: "spice", estimatedUnitCost: 0.1, unit: "tbsp", commonPackageSize: "0.5 oz dried (~$4)", shelfLifeDays: 365, tags: ["vegan"] },

  // ===== Frozen =====
  // 30 oz bag $4, ~6 servings, $0.67/serving
  { id: "hash-browns", name: "Frozen hash browns", category: "frozen", estimatedUnitCost: 0.65, unit: "serving", commonPackageSize: "30 oz bag (~$4.00)", shelfLifeDays: 180, tags: ["cheap","vegan","gluten-free"] },
  // $3.49/16 oz bag, ~4-5 cups per bag = ~$0.75/cup
  { id: "frozen-pineapple", name: "Frozen pineapple", category: "frozen", estimatedUnitCost: 0.75, unit: "cup", commonPackageSize: "16 oz bag (~$3.49)", shelfLifeDays: 180, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $3.99/16 oz bag, ~5 cups per bag = ~$0.80/cup
  { id: "frozen-peaches", name: "Frozen peaches", category: "frozen", estimatedUnitCost: 0.8, unit: "cup", commonPackageSize: "16 oz bag (~$3.99)", shelfLifeDays: 180, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // $4.49/12 oz bag, ~3.5 cups per bag = ~$1.28/cup
  { id: "frozen-cherries", name: "Frozen cherries", category: "frozen", estimatedUnitCost: 1.25, unit: "cup", commonPackageSize: "12 oz bag (~$4.49)", shelfLifeDays: 180, tags: ["vegan","vegetarian","gluten-free","dairy-free"] },
  // Tombstone/Red Baron 12 in pizza ~$5.50 each
  { id: "frozen-pizza", name: "Frozen pizza", category: "frozen", estimatedUnitCost: 5.5, unit: "pizza", commonPackageSize: "12 inch pizza (~$5.50)", shelfLifeDays: 180, tags: ["vegetarian"] },
  // 32 oz bag $4.50, ~13 servings, $0.35/serving
  { id: "frozen-fries", name: "Frozen french fries", category: "frozen", estimatedUnitCost: 0.35, unit: "serving", commonPackageSize: "32 oz bag (~$4.50)", shelfLifeDays: 270, tags: ["cheap","vegan","vegetarian"] },
  // 32 oz bag $5.00, ~12 servings, $0.40/serving
  { id: "frozen-tater-tots", name: "Frozen tater tots", category: "frozen", estimatedUnitCost: 0.4, unit: "serving", commonPackageSize: "32 oz bag (~$5.00)", shelfLifeDays: 270, tags: ["cheap","vegan","vegetarian"] },
  // Eggo 10-ct box $5.00, $0.50/waffle
  { id: "frozen-waffles", name: "Frozen waffles", category: "frozen", estimatedUnitCost: 0.5, unit: "piece", commonPackageSize: "10 ct box (~$5.00)", shelfLifeDays: 180, tags: ["vegetarian"] },
  // Jimmy Dean 4-ct $9.00, $2.25 each
  { id: "frozen-breakfast-sandwich", name: "Frozen breakfast sandwich", category: "frozen", estimatedUnitCost: 2.25, unit: "piece", commonPackageSize: "4 ct box (~$9.00)", shelfLifeDays: 180, tags: ["high-protein"] },
  // El Monterey 5-ct $8.75, $1.75 each
  { id: "frozen-burrito", name: "Frozen burrito", category: "frozen", estimatedUnitCost: 1.75, unit: "piece", commonPackageSize: "5 ct box (~$8.75)", shelfLifeDays: 180 },
  // Bibigo 36 oz ~36 pieces $11, $0.30/piece
  { id: "frozen-dumplings", name: "Frozen dumplings (potstickers)", category: "frozen", estimatedUnitCost: 0.3, unit: "piece", commonPackageSize: "36 oz bag (~$11.00)", shelfLifeDays: 270 },
  // 12-ct box $9.00, $0.75/roll
  { id: "frozen-spring-rolls", name: "Frozen spring rolls", category: "frozen", estimatedUnitCost: 0.75, unit: "piece", commonPackageSize: "12 ct box (~$9.00)", shelfLifeDays: 270, tags: ["vegetarian"] },
  // Cooked perfect 26 oz ~26 meatballs $9, $0.35 each
  { id: "frozen-meatballs", name: "Frozen meatballs", category: "frozen", estimatedUnitCost: 0.35, unit: "piece", commonPackageSize: "26 oz bag (~$9.00)", shelfLifeDays: 270, tags: ["high-protein"] },
  // Tyson 32 oz ~35 nuggets $10, ~$0.30/nugget
  { id: "frozen-chicken-nuggets", name: "Frozen chicken nuggets", category: "frozen", estimatedUnitCost: 0.3, unit: "piece", commonPackageSize: "32 oz bag (~$10.00)", shelfLifeDays: 270, tags: ["high-protein"] },
  // Tyson 24 oz ~12 tenders $10, $0.85/tender
  { id: "frozen-chicken-tenders", name: "Frozen chicken tenders", category: "frozen", estimatedUnitCost: 0.85, unit: "piece", commonPackageSize: "24 oz bag (~$10.00)", shelfLifeDays: 270, tags: ["high-protein"] },
  // Gorton's 24 oz ~24 sticks $9.50, $0.40 each
  { id: "frozen-fish-sticks", name: "Frozen fish sticks", category: "frozen", estimatedUnitCost: 0.4, unit: "piece", commonPackageSize: "24 oz box (~$9.50)", shelfLifeDays: 270, tags: ["high-protein"] },
  // Morningstar/Beyond 4-ct $8.00, $2.00/patty
  { id: "frozen-veggie-burger", name: "Frozen veggie burger", category: "frozen", estimatedUnitCost: 2, unit: "piece", commonPackageSize: "4 ct box (~$8.00)", shelfLifeDays: 270, tags: ["vegetarian","vegan"] },
  // 8-ct 1/4 lb patties $14, $1.75/patty
  { id: "frozen-burger-patty", name: "Frozen beef burger patty", category: "frozen", estimatedUnitCost: 1.75, unit: "piece", commonPackageSize: "8 ct box (~$14.00)", shelfLifeDays: 180, tags: ["high-protein"] },
  // Jimmy Dean 12-ct $6.50, ~$0.55/patty
  { id: "frozen-sausage-patty", name: "Frozen sausage patties", category: "frozen", estimatedUnitCost: 0.55, unit: "piece", commonPackageSize: "12 ct box (~$6.50)", shelfLifeDays: 180, tags: ["high-protein"] },
  // 4 lb bag ~24 wings $15, ~$0.65/wing
  { id: "frozen-wings", name: "Frozen chicken wings", category: "frozen", estimatedUnitCost: 0.65, unit: "piece", commonPackageSize: "4 lb bag (~$15.00)", shelfLifeDays: 270, tags: ["high-protein"] },
  // 16 oz bag $8.50, ~8 servings, ~$1.10/serving
  { id: "frozen-shrimp-popcorn", name: "Frozen popcorn shrimp", category: "frozen", estimatedUnitCost: 1.1, unit: "serving", commonPackageSize: "16 oz bag (~$8.50)", shelfLifeDays: 270, tags: ["high-protein"] },
  // 12 oz bag $2.50, ~3 cups, ~$0.85/cup
  { id: "frozen-cauliflower-rice", name: "Frozen cauliflower rice", category: "frozen", estimatedUnitCost: 0.85, unit: "cup", commonPackageSize: "12 oz bag (~$2.50)", shelfLifeDays: 270, tags: ["vegan","vegetarian","gluten-free"] },
  // 16 oz bag $3.00, ~5 cups, $0.60/cup
  { id: "frozen-stir-fry-mix", name: "Frozen stir-fry vegetable mix", category: "frozen", estimatedUnitCost: 0.6, unit: "cup", commonPackageSize: "16 oz bag (~$3.00)", shelfLifeDays: 270, tags: ["cheap","vegan","vegetarian"] },
  // 16 oz bag $2.75, ~5 cups, $0.55/cup
  { id: "frozen-green-beans", name: "Frozen green beans", category: "frozen", estimatedUnitCost: 0.55, unit: "cup", commonPackageSize: "16 oz bag (~$2.75)", shelfLifeDays: 270, tags: ["cheap","vegan","vegetarian"] },
  // Breyers 48 oz tub $5.50, ~12 half-cup servings ~$0.46
  { id: "ice-cream", name: "Ice cream", category: "frozen", estimatedUnitCost: 0.45, unit: "1/2 cup", commonPackageSize: "48 oz tub (~$5.50)", shelfLifeDays: 180, tags: ["vegetarian"] },

  // ===== Snacks, bakery, beverages =====
  // 16 oz bag $3.50, ~14 servings of 1 oz, $0.25/serving
  { id: "pretzels", name: "Pretzels", category: "snack", estimatedUnitCost: 0.25, unit: "serving", commonPackageSize: "16 oz bag (~$3.50)", shelfLifeDays: 180, tags: ["cheap","vegan","vegetarian"] },
  // 6 oz bag $3.99, ~7 servings of ~1 cup, $0.57/serving rounded $0.55
  { id: "popcorn-bagged", name: "Pre-popped popcorn", category: "snack", estimatedUnitCost: 0.55, unit: "serving", commonPackageSize: "6 oz bag (~$3.99)", shelfLifeDays: 90, tags: ["vegetarian","vegan","gluten-free"] },
  // 6-pack $5, $0.83/bag rounded $0.85
  { id: "microwave-popcorn", name: "Microwave popcorn", category: "snack", estimatedUnitCost: 0.85, unit: "bag", commonPackageSize: "6-pack (~$5.00)", shelfLifeDays: 270, tags: ["cheap","vegetarian","gluten-free"] },
  // 8 oz bag $4.49, ~7 servings of 1 oz, $0.64/serving
  { id: "pita-chips", name: "Pita chips", category: "snack", estimatedUnitCost: 0.65, unit: "serving", commonPackageSize: "8 oz bag (~$4.49)", shelfLifeDays: 120, tags: ["vegetarian","vegan"] },
  // 14.4 oz box $3.99, ~14 servings of 2 sheets, $0.29/serving
  { id: "graham-crackers", name: "Graham crackers", category: "snack", estimatedUnitCost: 0.3, unit: "serving", commonPackageSize: "14.4 oz box (~$3.99)", shelfLifeDays: 240, tags: ["vegetarian","baking","cheap"] },
  // 14.3 oz pack $4.49, ~10 servings of 3 cookies, $0.45/serving
  { id: "oreos", name: "Oreo cookies", category: "snack", estimatedUnitCost: 0.45, unit: "serving", commonPackageSize: "14.3 oz pack (~$4.49)", shelfLifeDays: 240, tags: ["vegetarian","baking"] },
  // 16 oz box $3.29, ~16 servings of 5 crackers, $0.21/serving
  { id: "saltines", name: "Saltine crackers", category: "snack", estimatedUnitCost: 0.2, unit: "serving", commonPackageSize: "16 oz box (~$3.29)", shelfLifeDays: 240, tags: ["cheap","vegetarian","vegan","staple"] },
  // 12-pack $8.99, $0.75/bar
  { id: "fig-bars", name: "Fig bars", category: "snack", estimatedUnitCost: 0.75, unit: "bar", commonPackageSize: "12-pack (~$8.99)", shelfLifeDays: 180, tags: ["vegetarian"] },
  // 6-pack $4.19, $0.70/cup
  { id: "applesauce-cup", name: "Applesauce cup", category: "snack", estimatedUnitCost: 0.7, unit: "cup", commonPackageSize: "6-pack 4 oz cups (~$4.19)", shelfLifeDays: 365, tags: ["vegan","vegetarian","gluten-free"] },
  // 16 oz bag $7.99, ~7 servings of ~1/4 cup, $1.14/serving
  { id: "trail-mix", name: "Trail mix", category: "snack", estimatedUnitCost: 1.1, unit: "serving", commonPackageSize: "16 oz bag (~$7.99)", shelfLifeDays: 180, tags: ["vegetarian","high-protein"] },
  // 16 oz jar $8.99, ~7 servings of 1 oz, $1.28/serving
  { id: "mixed-nuts", name: "Mixed nuts", category: "snack", estimatedUnitCost: 1.25, unit: "serving", commonPackageSize: "16 oz jar (~$8.99)", shelfLifeDays: 270, tags: ["vegetarian","high-protein","gluten-free"] },
  // 3.25 oz bag $8.49, $2.61/oz
  { id: "beef-jerky", name: "Beef jerky", category: "snack", estimatedUnitCost: 2.5, unit: "oz", commonPackageSize: "3.25 oz bag (~$8.49)", shelfLifeDays: 365, tags: ["high-protein","gluten-free"] },
  // 12-pack $23.99, $2.00/bar
  { id: "protein-bar", name: "Protein bar", category: "snack", estimatedUnitCost: 2, unit: "bar", commonPackageSize: "12-pack (~$23.99)", shelfLifeDays: 270, tags: ["high-protein","vegetarian"] },
  // 12-pack $29.99, $2.50/bar
  { id: "rxbar", name: "RXBAR", category: "snack", estimatedUnitCost: 2.5, unit: "bar", commonPackageSize: "12-pack (~$29.99)", shelfLifeDays: 270, tags: ["high-protein","gluten-free"] },
  // 12-pack $17.99, $1.50/bar
  { id: "clif-bar", name: "Clif bar", category: "snack", estimatedUnitCost: 1.5, unit: "bar", commonPackageSize: "12-pack (~$17.99)", shelfLifeDays: 365, tags: ["vegan","vegetarian"] },
  // 12-pack $20.99, $1.75/bar
  { id: "kind-bar", name: "KIND bar", category: "snack", estimatedUnitCost: 1.75, unit: "bar", commonPackageSize: "12-pack (~$20.99)", shelfLifeDays: 365, tags: ["gluten-free","vegetarian"] },
  // 8-pack $9.99, $1.25/bottle
  { id: "sports-drink", name: "Sports drink (Gatorade)", category: "snack", estimatedUnitCost: 1.25, unit: "serving", commonPackageSize: "8-pack 20 oz bottles (~$9.99)", shelfLifeDays: 365, tags: ["gluten-free"] },
  // 8-pack $4.49, $0.56/can rounded $0.55
  { id: "sparkling-water", name: "Sparkling water (La Croix)", category: "snack", estimatedUnitCost: 0.55, unit: "can", commonPackageSize: "8-pack 12 oz cans (~$4.49)", shelfLifeDays: 365, tags: ["cheap","vegan","gluten-free"] },
  // 32 oz bottle $5.99, ~4 servings of 8 oz, $1.50/cup
  { id: "cold-brew-coffee", name: "Cold brew coffee", category: "snack", estimatedUnitCost: 1.25, unit: "cup", commonPackageSize: "32 oz bottle (~$5.99)", shelfLifeDays: 21, tags: ["vegan","gluten-free"] },
  // 8 oz jar $9.99, ~100 tsp, $0.10/tsp
  { id: "instant-coffee", name: "Instant coffee", category: "snack", estimatedUnitCost: 0.1, unit: "tsp", commonPackageSize: "8 oz jar (~$9.99)", shelfLifeDays: 730, tags: ["staple","vegan","gluten-free"] },
  // 1 oz tin $14.99, ~17 tsp, $0.88/tsp rounded $0.85
  { id: "matcha-powder", name: "Matcha powder", category: "snack", estimatedUnitCost: 0.85, unit: "tsp", commonPackageSize: "1 oz tin (~$14.99)", shelfLifeDays: 365, tags: ["vegan","gluten-free"] },
  // 100-count box $5.99, $0.06/bag; premium $0.15/bag avg
  { id: "tea-bags", name: "Tea bags", category: "snack", estimatedUnitCost: 0.15, unit: "bag", commonPackageSize: "100-count box (~$5.99)", shelfLifeDays: 730, tags: ["staple","cheap","vegan","gluten-free"] },
  // 10-packet box $3.99, $0.40/packet
  { id: "hot-chocolate-mix", name: "Hot chocolate mix", category: "snack", estimatedUnitCost: 0.4, unit: "pack", commonPackageSize: "10-packet box (~$3.99)", shelfLifeDays: 365, tags: ["vegetarian","cheap"] },

  // ===== Macro-recipe ingredient extensions (not in pantry-expansion-v2) =====
  { id: "acai-pack", name: "Frozen acai packet", category: "frozen", estimatedUnitCost: 2.50, unit: "packet", commonPackageSize: "3.5 oz (~$2.50)", shelfLifeDays: 365 },
  { id: "active-dry-yeast", name: "Active dry yeast", category: "spice", estimatedUnitCost: 0.50, unit: "packet", commonPackageSize: "3-pack (~$2)", shelfLifeDays: 730 },
  { id: "aji-amarillo-paste", name: "Aji amarillo paste", category: "condiment", estimatedUnitCost: 0.40, unit: "tbsp", commonPackageSize: "8 oz (~$6)", shelfLifeDays: 365 },
  { id: "amba-sauce", name: "Amba sauce", category: "condiment", estimatedUnitCost: 0.57, unit: "tbsp", commonPackageSize: "7 oz (~$4)", shelfLifeDays: 365 },
  { id: "amchur-powder", name: "Amchur (dry mango powder)", category: "spice", estimatedUnitCost: 0.30, unit: "tsp", commonPackageSize: "2 oz (~$4)", shelfLifeDays: 730 },
  { id: "anchovy-stock", name: "Anchovy stock powder", category: "condiment", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "2 oz (~$4)", shelfLifeDays: 365 },
  { id: "annatto-powder", name: "Annatto powder", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  { id: "apple-juice", name: "Apple juice", category: "condiment", estimatedUnitCost: 0.25, unit: "cup", commonPackageSize: "64 oz (~$3.50)", shelfLifeDays: 30 },
  { id: "apricot-jam", name: "Apricot jam", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "12 oz (~$4)", shelfLifeDays: 365 },
  { id: "banana-blossom", name: "Banana blossom (canned)", category: "canned", estimatedUnitCost: 2.50, unit: "can", commonPackageSize: "20 oz (~$2.50)", shelfLifeDays: 730, tags: ["vegan"] },
  { id: "barberries", name: "Dried barberries", category: "fruit", estimatedUnitCost: 0.50, unit: "tbsp", commonPackageSize: "4 oz (~$6)", shelfLifeDays: 365 },
  { id: "basil", name: "Fresh basil", category: "vegetable", estimatedUnitCost: 0.58, unit: "tbsp", commonPackageSize: "0.75 oz (~$3.50)", shelfLifeDays: 5 },
  { id: "bay-leaves", name: "Bay leaves", category: "spice", estimatedUnitCost: 0.10, unit: "leaf", commonPackageSize: "0.25 oz (~$3)", shelfLifeDays: 730 },
  { id: "bean-sprouts", name: "Bean sprouts", category: "vegetable", estimatedUnitCost: 0.83, unit: "cup", commonPackageSize: "12 oz (~$2.50)", shelfLifeDays: 5 },
  { id: "beef-brisket", name: "Beef brisket", category: "protein", estimatedUnitCost: 2.25, unit: "serving", commonPackageSize: "1 lb (~$9)", shelfLifeDays: 3 },
  { id: "beef-chuck", name: "Beef chuck", category: "protein", estimatedUnitCost: 1.75, unit: "serving", commonPackageSize: "1 lb (~$7)", shelfLifeDays: 3 },
  { id: "beef-sirloin", name: "Beef sirloin", category: "protein", estimatedUnitCost: 2.75, unit: "serving", commonPackageSize: "1 lb (~$11)", shelfLifeDays: 3 },
  { id: "beer", name: "Beer (cooking)", category: "condiment", estimatedUnitCost: 0.14, unit: "oz", commonPackageSize: "12 oz can (~$1.67)", shelfLifeDays: 90 },
  { id: "beets", name: "Beets", category: "vegetable", estimatedUnitCost: 0.88, unit: "beet", commonPackageSize: "bunch (~$3.50)", shelfLifeDays: 30 },
  { id: "berbere-spice", name: "Berbere spice blend", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "2 oz (~$4)", shelfLifeDays: 730 },
  { id: "black-pepper", name: "Black pepper", category: "spice", estimatedUnitCost: 0.19, unit: "tsp", commonPackageSize: "3 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "black-vinegar", name: "Chinese black vinegar", category: "condiment", estimatedUnitCost: 0.13, unit: "tbsp", commonPackageSize: "16 oz (~$4)", shelfLifeDays: 1095 },
  { id: "blue-cheese", name: "Blue cheese", category: "dairy", estimatedUnitCost: 1.25, unit: "1/4 cup", commonPackageSize: "4 oz (~$5)", shelfLifeDays: 30 },
  { id: "bread-slices", name: "Bread slices", category: "grain", estimatedUnitCost: 0.18, unit: "slice", commonPackageSize: "loaf (~$3.50)", shelfLifeDays: 7 },
  { id: "broccolini", name: "Broccolini", category: "vegetable", estimatedUnitCost: 1.50, unit: "cup", commonPackageSize: "8 oz (~$3)", shelfLifeDays: 5 },
  { id: "brown-lentils", name: "Brown lentils", category: "grain", estimatedUnitCost: 1.30, unit: "cup-dry", commonPackageSize: "1 lb (~$3)", shelfLifeDays: 365 },
  { id: "bulgur-wheat", name: "Bulgur wheat", category: "grain", estimatedUnitCost: 0.80, unit: "cup-dry", commonPackageSize: "1 lb (~$2.50)", shelfLifeDays: 365 },
  { id: "canadian-bacon", name: "Canadian bacon", category: "protein", estimatedUnitCost: 0.80, unit: "slice", commonPackageSize: "6 oz (~$5)", shelfLifeDays: 14 },
  { id: "canned-clams", name: "Canned clams", category: "canned", estimatedUnitCost: 3.00, unit: "can", commonPackageSize: "6.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "canned-jackfruit", name: "Canned jackfruit", category: "canned", estimatedUnitCost: 2.50, unit: "can", commonPackageSize: "20 oz (~$2.50)", shelfLifeDays: 730, tags: ["vegan"] },
  { id: "caraway-seeds", name: "Caraway seeds", category: "spice", estimatedUnitCost: 0.44, unit: "tsp", commonPackageSize: "1.4 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "cardamom", name: "Cardamom", category: "spice", estimatedUnitCost: 0.58, unit: "tsp", commonPackageSize: "2 oz (~$7)", shelfLifeDays: 730 },
  { id: "cayenne-pepper", name: "Cayenne pepper", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "2 oz (~$3)", shelfLifeDays: 730 },
  { id: "celeriac", name: "Celeriac", category: "vegetable", estimatedUnitCost: 3.50, unit: "celeriac", commonPackageSize: "single (~$3.50)", shelfLifeDays: 30 },
  { id: "char-siu", name: "Char siu (BBQ pork)", category: "protein", estimatedUnitCost: 2.50, unit: "serving", commonPackageSize: "1 lb (~$10)", shelfLifeDays: 3 },
  { id: "chayote", name: "Chayote", category: "vegetable", estimatedUnitCost: 1.50, unit: "chayote", commonPackageSize: "single (~$1.50)", shelfLifeDays: 30 },
  { id: "chili-flakes", name: "Chili flakes", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "chinese-sausage", name: "Chinese sausage", category: "protein", estimatedUnitCost: 1.00, unit: "link", commonPackageSize: "12 oz (~$7)", shelfLifeDays: 21 },
  { id: "cilantro", name: "Fresh cilantro", category: "vegetable", estimatedUnitCost: 0.17, unit: "tbsp", commonPackageSize: "bunch (~$1)", shelfLifeDays: 7 },
  { id: "cloves", name: "Whole cloves", category: "spice", estimatedUnitCost: 0.74, unit: "tsp", commonPackageSize: "0.9 oz (~$4)", shelfLifeDays: 1095 },
  { id: "cocoa-powder", name: "Cocoa powder", category: "spice", estimatedUnitCost: 0.13, unit: "tbsp", commonPackageSize: "8 oz (~$4.50)", shelfLifeDays: 730 },
  { id: "coconut-flakes", name: "Coconut flakes", category: "snack", estimatedUnitCost: 0.25, unit: "1/4 cup", commonPackageSize: "7 oz (~$4)", shelfLifeDays: 365, tags: ["vegan"] },
  { id: "cod-fillet", name: "Cod fillet", category: "protein", estimatedUnitCost: 2.67, unit: "serving", commonPackageSize: "1 lb (~$8)", shelfLifeDays: 2 },
  { id: "coleslaw", name: "Coleslaw mix", category: "vegetable", estimatedUnitCost: 0.50, unit: "cup", commonPackageSize: "14 oz bag (~$2.50)", shelfLifeDays: 7 },
  { id: "coleslaw-mix", name: "Coleslaw mix", category: "vegetable", estimatedUnitCost: 0.50, unit: "cup", commonPackageSize: "14 oz bag (~$2.50)", shelfLifeDays: 7 },
  { id: "collard-greens", name: "Collard greens", category: "vegetable", estimatedUnitCost: 0.63, unit: "cup", commonPackageSize: "bunch (~$2.50)", shelfLifeDays: 5 },
  { id: "condensed-milk", name: "Sweetened condensed milk", category: "canned", estimatedUnitCost: 1.75, unit: "can", commonPackageSize: "14 oz (~$1.75)", shelfLifeDays: 730 },
  { id: "coriander", name: "Coriander (ground)", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "corn-tortilla-chips", name: "Corn tortilla chips", category: "snack", estimatedUnitCost: 0.35, unit: "serving", commonPackageSize: "10 oz (~$3.50)", shelfLifeDays: 60 },
  { id: "cranberry-sauce", name: "Cranberry sauce", category: "canned", estimatedUnitCost: 2.00, unit: "can", commonPackageSize: "14 oz (~$2)", shelfLifeDays: 730 },
  { id: "crayfish", name: "Crayfish / crawfish", category: "protein", estimatedUnitCost: 3.33, unit: "serving", commonPackageSize: "1 lb (~$10)", shelfLifeDays: 2 },
  { id: "cube-steak", name: "Cube steak", category: "protein", estimatedUnitCost: 1.75, unit: "serving", commonPackageSize: "1 lb (~$7)", shelfLifeDays: 3 },
  { id: "cumin-seeds", name: "Cumin seeds", category: "spice", estimatedUnitCost: 0.39, unit: "tsp", commonPackageSize: "1.5 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "dark-chocolate", name: "Dark chocolate", category: "snack", estimatedUnitCost: 0.85, unit: "oz", commonPackageSize: "3 oz bar (~$2.50)", shelfLifeDays: 365 },
  { id: "dashi", name: "Dashi stock", category: "condiment", estimatedUnitCost: 0.75, unit: "cup", commonPackageSize: "pack (~$5)", shelfLifeDays: 365 },
  { id: "dill", name: "Fresh dill", category: "vegetable", estimatedUnitCost: 0.60, unit: "tbsp", commonPackageSize: "0.5 oz (~$3)", shelfLifeDays: 5 },
  { id: "doenjang-paste", name: "Doenjang (fermented soybean paste)", category: "condiment", estimatedUnitCost: 0.19, unit: "tbsp", commonPackageSize: "16 oz (~$6)", shelfLifeDays: 365 },
  { id: "doubanjiang", name: "Doubanjiang (chili bean paste)", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "14 oz (~$7)", shelfLifeDays: 365 },
  { id: "dried-anchovies", name: "Dried anchovies", category: "protein", estimatedUnitCost: 1.50, unit: "oz", commonPackageSize: "3 oz (~$4.50)", shelfLifeDays: 180 },
  { id: "dried-apricots", name: "Dried apricots", category: "fruit", estimatedUnitCost: 0.80, unit: "1/4 cup", commonPackageSize: "6 oz (~$4)", shelfLifeDays: 180 },
  { id: "dried-chili", name: "Dried chili", category: "spice", estimatedUnitCost: 0.50, unit: "chili", commonPackageSize: "2 oz (~$4)", shelfLifeDays: 730 },
  { id: "dried-cranberries", name: "Dried cranberries", category: "fruit", estimatedUnitCost: 0.35, unit: "1/4 cup", commonPackageSize: "12 oz (~$4)", shelfLifeDays: 365 },
  { id: "dried-oregano", name: "Dried oregano", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  { id: "dried-rosemary", name: "Dried rosemary", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  { id: "dried-shrimp", name: "Dried shrimp", category: "protein", estimatedUnitCost: 1.25, unit: "oz", commonPackageSize: "3 oz (~$3.75)", shelfLifeDays: 365 },
  { id: "dried-thyme", name: "Dried thyme", category: "spice", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  { id: "egg-noodles", name: "Egg noodles", category: "grain", estimatedUnitCost: 0.50, unit: "serving", commonPackageSize: "12 oz (~$2.50)", shelfLifeDays: 365 },
  { id: "egusi", name: "Egusi (ground melon seeds)", category: "protein", estimatedUnitCost: 1.00, unit: "1/4 cup", commonPackageSize: "1 lb (~$8)", shelfLifeDays: 180 },
  { id: "elbow-pasta", name: "Elbow macaroni", category: "grain", estimatedUnitCost: 0.38, unit: "serving", commonPackageSize: "1 lb box (~$1.50)", shelfLifeDays: 365 },
  { id: "endive", name: "Endive", category: "vegetable", estimatedUnitCost: 1.00, unit: "head", commonPackageSize: "single (~$2)", shelfLifeDays: 7 },
  { id: "fava-beans", name: "Fava beans", category: "canned", estimatedUnitCost: 2.00, unit: "can", commonPackageSize: "15 oz (~$2)", shelfLifeDays: 730 },
  { id: "fennel", name: "Fennel bulb", category: "vegetable", estimatedUnitCost: 3.00, unit: "bulb", commonPackageSize: "single (~$3)", shelfLifeDays: 14 },
  { id: "fennel-seeds", name: "Fennel seeds", category: "spice", estimatedUnitCost: 0.44, unit: "tsp", commonPackageSize: "1.4 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "fish-broth", name: "Fish broth", category: "canned", estimatedUnitCost: 0.85, unit: "cup", commonPackageSize: "32 oz (~$3.50)", shelfLifeDays: 365 },
  { id: "fish-cake", name: "Fish cake", category: "protein", estimatedUnitCost: 1.25, unit: "piece", commonPackageSize: "7 oz (~$5)", shelfLifeDays: 7 },
  { id: "flaxseeds", name: "Flaxseeds", category: "protein", estimatedUnitCost: 0.08, unit: "tbsp", commonPackageSize: "1 lb (~$4)", shelfLifeDays: 365 },
  { id: "freekeh", name: "Freekeh", category: "grain", estimatedUnitCost: 1.50, unit: "cup-dry", commonPackageSize: "1 lb (~$5)", shelfLifeDays: 365 },
  { id: "galangal", name: "Galangal", category: "vegetable", estimatedUnitCost: 0.20, unit: "tsp", commonPackageSize: "piece (~$2)", shelfLifeDays: 14 },
  { id: "gelatin", name: "Gelatin (unflavored)", category: "spice", estimatedUnitCost: 0.50, unit: "packet", commonPackageSize: "4-pack (~$2)", shelfLifeDays: 730 },
  { id: "ginger-powder", name: "Ground ginger", category: "spice", estimatedUnitCost: 0.33, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "gingersnap-cookies", name: "Gingersnap cookies", category: "snack", estimatedUnitCost: 0.25, unit: "cookie", commonPackageSize: "16 oz (~$4)", shelfLifeDays: 180 },
  { id: "glass-noodles", name: "Glass noodles / cellophane noodles", category: "grain", estimatedUnitCost: 0.50, unit: "serving", commonPackageSize: "3.5 oz (~$2)", shelfLifeDays: 365 },
  { id: "green-beans", name: "Green beans", category: "vegetable", estimatedUnitCost: 1.17, unit: "cup", commonPackageSize: "12 oz (~$3.50)", shelfLifeDays: 7 },
  { id: "green-lentils", name: "Green lentils", category: "grain", estimatedUnitCost: 0.85, unit: "cup-dry", commonPackageSize: "1 lb (~$2)", shelfLifeDays: 365 },
  { id: "ground-lamb", name: "Ground lamb", category: "protein", estimatedUnitCost: 2.25, unit: "serving", commonPackageSize: "1 lb (~$9)", shelfLifeDays: 3, tags: ["high-protein"] },
  { id: "ground-veal", name: "Ground veal", category: "protein", estimatedUnitCost: 2.50, unit: "serving", commonPackageSize: "1 lb (~$10)", shelfLifeDays: 3, tags: ["high-protein"] },
  { id: "gruyere", name: "Gruyere", category: "dairy", estimatedUnitCost: 1.00, unit: "1/4 cup", commonPackageSize: "8 oz (~$8)", shelfLifeDays: 21 },
  { id: "herbes-de-provence", name: "Herbes de Provence", category: "spice", estimatedUnitCost: 0.95, unit: "tsp", commonPackageSize: "0.7 oz (~$4)", shelfLifeDays: 730 },
  { id: "hoagie-rolls", name: "Hoagie rolls", category: "grain", estimatedUnitCost: 0.75, unit: "roll", commonPackageSize: "4 ct (~$3)", shelfLifeDays: 7 },
  { id: "hominy", name: "Hominy (canned)", category: "canned", estimatedUnitCost: 3.00, unit: "can", commonPackageSize: "29 oz (~$3)", shelfLifeDays: 730 },
  { id: "horseradish", name: "Prepared horseradish", category: "condiment", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "8 oz (~$4)", shelfLifeDays: 180 },
  { id: "ice", name: "Ice", category: "condiment", estimatedUnitCost: 0.00, unit: "cup", commonPackageSize: "tap water", shelfLifeDays: 1 },
  { id: "injera", name: "Injera flatbread", category: "grain", estimatedUnitCost: 1.00, unit: "piece", commonPackageSize: "2-pack (~$4)", shelfLifeDays: 7 },
  { id: "italian-sausage", name: "Italian sausage", category: "protein", estimatedUnitCost: 1.40, unit: "serving", commonPackageSize: "1 lb (~$5.50)", shelfLifeDays: 7 },
  { id: "kaffir-lime-leaves", name: "Kaffir lime leaves", category: "vegetable", estimatedUnitCost: 0.30, unit: "leaf", commonPackageSize: "pack (~$3)", shelfLifeDays: 14 },
  { id: "kielbasa", name: "Kielbasa", category: "protein", estimatedUnitCost: 1.25, unit: "serving", commonPackageSize: "14 oz (~$5)", shelfLifeDays: 14 },
  { id: "laksa-paste", name: "Laksa paste", category: "condiment", estimatedUnitCost: 0.63, unit: "tbsp", commonPackageSize: "4 oz (~$5)", shelfLifeDays: 365 },
  { id: "lamb-shoulder", name: "Lamb shoulder", category: "protein", estimatedUnitCost: 2.50, unit: "serving", commonPackageSize: "1 lb (~$10)", shelfLifeDays: 3 },
  { id: "lingonberry-jam", name: "Lingonberry jam", category: "condiment", estimatedUnitCost: 0.45, unit: "tbsp", commonPackageSize: "14 oz (~$7)", shelfLifeDays: 365 },
  { id: "mango", name: "Mango", category: "fruit", estimatedUnitCost: 2.00, unit: "mango", commonPackageSize: "single (~$2)", shelfLifeDays: 5 },
  { id: "marinara-sauce", name: "Marinara sauce", category: "canned", estimatedUnitCost: 1.17, unit: "cup", commonPackageSize: "24 oz jar (~$3.50)", shelfLifeDays: 730 },
  { id: "marjoram", name: "Fresh marjoram", category: "vegetable", estimatedUnitCost: 0.12, unit: "tbsp", commonPackageSize: "bunch (~$1.75)", shelfLifeDays: 7 },
  { id: "marsala-wine", name: "Marsala wine", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "750ml (~$10)", shelfLifeDays: 180 },
  { id: "masarepa", name: "Masarepa (pre-cooked corn flour)", category: "grain", estimatedUnitCost: 0.50, unit: "cup", commonPackageSize: "2 lb (~$4)", shelfLifeDays: 365 },
  { id: "massaman-paste", name: "Massaman curry paste", category: "condiment", estimatedUnitCost: 0.60, unit: "tbsp", commonPackageSize: "4 oz (~$5)", shelfLifeDays: 365 },
  { id: "merguez", name: "Merguez sausage", category: "protein", estimatedUnitCost: 2.00, unit: "serving", commonPackageSize: "1 lb (~$8)", shelfLifeDays: 3 },
  { id: "millet", name: "Millet", category: "grain", estimatedUnitCost: 1.40, unit: "cup-dry", commonPackageSize: "1 lb (~$3.50)", shelfLifeDays: 365, tags: ["gluten-free"] },
  { id: "millet-flour", name: "Millet flour", category: "grain", estimatedUnitCost: 0.35, unit: "cup", commonPackageSize: "2 lb (~$5)", shelfLifeDays: 180 },
  { id: "mint", name: "Fresh mint", category: "vegetable", estimatedUnitCost: 0.58, unit: "tbsp", commonPackageSize: "0.75 oz (~$3.50)", shelfLifeDays: 5 },
  { id: "mung-beans", name: "Mung beans", category: "grain", estimatedUnitCost: 1.30, unit: "cup-dry", commonPackageSize: "1 lb (~$3)", shelfLifeDays: 365 },
  { id: "mussels", name: "Mussels", category: "protein", estimatedUnitCost: 1.67, unit: "serving", commonPackageSize: "1 lb (~$5)", shelfLifeDays: 2 },
  { id: "mustard-seeds", name: "Mustard seeds", category: "spice", estimatedUnitCost: 0.39, unit: "tsp", commonPackageSize: "1.5 oz (~$3.50)", shelfLifeDays: 730 },
  { id: "nori", name: "Nori sheets", category: "snack", estimatedUnitCost: 0.40, unit: "sheet", commonPackageSize: "10-pack (~$4)", shelfLifeDays: 365, tags: ["umami", "gluten-free"] },
  { id: "oat-flour", name: "Oat flour", category: "grain", estimatedUnitCost: 0.30, unit: "cup", commonPackageSize: "1 lb (~$4)", shelfLifeDays: 180 },
  { id: "octopus", name: "Octopus", category: "protein", estimatedUnitCost: 4.00, unit: "serving", commonPackageSize: "1 lb (~$12)", shelfLifeDays: 2 },
  { id: "olives", name: "Olives", category: "condiment", estimatedUnitCost: 0.50, unit: "1/4 cup", commonPackageSize: "6 oz (~$4)", shelfLifeDays: 365 },
  { id: "oxtail", name: "Oxtail", category: "protein", estimatedUnitCost: 2.75, unit: "serving", commonPackageSize: "1 lb (~$11)", shelfLifeDays: 3 },
  { id: "panang-curry-paste", name: "Panang curry paste", category: "condiment", estimatedUnitCost: 0.55, unit: "tbsp", commonPackageSize: "4 oz (~$4.50)", shelfLifeDays: 365 },
  { id: "pancetta", name: "Pancetta", category: "protein", estimatedUnitCost: 1.50, unit: "oz", commonPackageSize: "4 oz (~$6)", shelfLifeDays: 14 },
  { id: "parsley", name: "Fresh parsley", category: "vegetable", estimatedUnitCost: 0.25, unit: "tbsp", commonPackageSize: "bunch (~$1.50)", shelfLifeDays: 7 },
  { id: "parsnips", name: "Parsnip", category: "vegetable", estimatedUnitCost: 0.75, unit: "parsnip", commonPackageSize: "bunch (~$3)", shelfLifeDays: 30 },
  { id: "pav-bhaji-masala", name: "Pav bhaji masala", category: "spice", estimatedUnitCost: 0.19, unit: "tsp", commonPackageSize: "3.5 oz (~$4)", shelfLifeDays: 730 },
  { id: "pearl-barley", name: "Pearl barley", category: "grain", estimatedUnitCost: 0.55, unit: "cup-dry", commonPackageSize: "1 lb (~$2.50)", shelfLifeDays: 365 },
  { id: "peas", name: "Peas (frozen)", category: "frozen", estimatedUnitCost: 0.62, unit: "cup", commonPackageSize: "10 oz (~$2.50)", shelfLifeDays: 180 },
  { id: "pecorino-romano", name: "Pecorino Romano", category: "dairy", estimatedUnitCost: 0.56, unit: "1/4 cup", commonPackageSize: "5 oz (~$5)", shelfLifeDays: 30 },
  { id: "pepitas", name: "Pepitas (pumpkin seeds)", category: "protein", estimatedUnitCost: 0.16, unit: "tbsp", commonPackageSize: "8 oz (~$5)", shelfLifeDays: 180 },
  { id: "phyllo", name: "Phyllo dough", category: "grain", estimatedUnitCost: 0.30, unit: "sheet", commonPackageSize: "1 lb (~$6)", shelfLifeDays: 14 },
  { id: "pickles", name: "Pickles", category: "condiment", estimatedUnitCost: 0.50, unit: "1/4 cup", commonPackageSize: "32 oz (~$4)", shelfLifeDays: 365 },
  { id: "polenta", name: "Polenta", category: "grain", estimatedUnitCost: 0.38, unit: "cup", commonPackageSize: "18 oz (~$3.50)", shelfLifeDays: 365 },
  { id: "pomegranate-seeds", name: "Pomegranate arils", category: "fruit", estimatedUnitCost: 2.00, unit: "1/4 cup", commonPackageSize: "8 oz (~$5)", shelfLifeDays: 7 },
  { id: "poppy-seeds", name: "Poppy seeds", category: "spice", estimatedUnitCost: 0.20, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "pork-belly", name: "Pork belly", category: "protein", estimatedUnitCost: 2.00, unit: "serving", commonPackageSize: "1 lb (~$8)", shelfLifeDays: 3 },
  { id: "preserved-lemon", name: "Preserved lemon", category: "condiment", estimatedUnitCost: 0.75, unit: "tbsp", commonPackageSize: "8 oz (~$6)", shelfLifeDays: 365 },
  { id: "puffed-rice", name: "Puffed rice cereal", category: "grain", estimatedUnitCost: 0.20, unit: "cup", commonPackageSize: "10 oz (~$3)", shelfLifeDays: 180 },
  { id: "pumpkin", name: "Pumpkin (canned)", category: "canned", estimatedUnitCost: 1.14, unit: "cup", commonPackageSize: "15 oz (~$2)", shelfLifeDays: 730 },
  { id: "red-beans", name: "Red beans (canned)", category: "canned", estimatedUnitCost: 1.10, unit: "can", commonPackageSize: "15 oz (~$1.10)", shelfLifeDays: 730 },
  { id: "red-curry-paste-thai", name: "Thai red curry paste", category: "condiment", estimatedUnitCost: 0.50, unit: "tbsp", commonPackageSize: "4 oz (~$4)", shelfLifeDays: 365 },
  { id: "red-lentils", name: "Red lentils", category: "grain", estimatedUnitCost: 1.30, unit: "cup-dry", commonPackageSize: "1 lb (~$3)", shelfLifeDays: 365 },
  { id: "red-wine", name: "Red wine (cooking)", category: "condiment", estimatedUnitCost: 0.36, unit: "tbsp", commonPackageSize: "750ml (~$9)", shelfLifeDays: 30 },
  { id: "ribeye", name: "Ribeye steak", category: "protein", estimatedUnitCost: 5.00, unit: "serving", commonPackageSize: "12 oz (~$15)", shelfLifeDays: 3 },
  { id: "rice-crackers", name: "Rice crackers", category: "snack", estimatedUnitCost: 0.25, unit: "serving", commonPackageSize: "10 oz (~$3)", shelfLifeDays: 90, tags: ["gluten-free"] },
  { id: "rice-vermicelli", name: "Rice vermicelli", category: "grain", estimatedUnitCost: 0.50, unit: "serving", commonPackageSize: "14 oz (~$2.50)", shelfLifeDays: 365 },
  { id: "rice-wine", name: "Shaoxing rice wine", category: "condiment", estimatedUnitCost: 0.15, unit: "tbsp", commonPackageSize: "16 oz (~$4)", shelfLifeDays: 365 },
  { id: "roasted-red-pepper", name: "Roasted red peppers (jarred)", category: "canned", estimatedUnitCost: 1.50, unit: "cup", commonPackageSize: "12 oz (~$3)", shelfLifeDays: 730 },
  { id: "rosemary", name: "Fresh rosemary", category: "vegetable", estimatedUnitCost: 0.30, unit: "sprig", commonPackageSize: "0.5 oz (~$3)", shelfLifeDays: 14 },
  { id: "rye-flour", name: "Rye flour", category: "grain", estimatedUnitCost: 0.25, unit: "cup", commonPackageSize: "2 lb (~$4)", shelfLifeDays: 180 },
  { id: "sake", name: "Sake (cooking)", category: "condiment", estimatedUnitCost: 0.24, unit: "tbsp", commonPackageSize: "750ml (~$12)", shelfLifeDays: 30 },
  { id: "salt-cod", name: "Salt cod", category: "protein", estimatedUnitCost: 3.50, unit: "serving", commonPackageSize: "1 lb (~$14)", shelfLifeDays: 180 },
  { id: "sambal", name: "Sambal oelek", category: "condiment", estimatedUnitCost: 0.08, unit: "tsp", commonPackageSize: "7 oz (~$3)", shelfLifeDays: 365 },
  { id: "sauerkraut", name: "Sauerkraut", category: "condiment", estimatedUnitCost: 0.75, unit: "cup", commonPackageSize: "16 oz (~$3)", shelfLifeDays: 60 },
  { id: "scallops", name: "Scallops", category: "protein", estimatedUnitCost: 4.00, unit: "serving", commonPackageSize: "1 lb (~$16)", shelfLifeDays: 2 },
  { id: "seafood-broth", name: "Seafood broth", category: "canned", estimatedUnitCost: 0.85, unit: "cup", commonPackageSize: "32 oz (~$3.50)", shelfLifeDays: 365 },
  { id: "semolina", name: "Semolina", category: "grain", estimatedUnitCost: 0.60, unit: "cup", commonPackageSize: "1 lb (~$2.50)", shelfLifeDays: 365 },
  { id: "sesame-paste", name: "Sesame paste", category: "condiment", estimatedUnitCost: 0.28, unit: "tbsp", commonPackageSize: "16 oz (~$9)", shelfLifeDays: 365 },
  { id: "shrimp-paste", name: "Shrimp paste", category: "condiment", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "7 oz (~$5)", shelfLifeDays: 365 },
  { id: "skirt-steak", name: "Skirt steak", category: "protein", estimatedUnitCost: 2.25, unit: "serving", commonPackageSize: "1 lb (~$9)", shelfLifeDays: 3 },
  { id: "skyr", name: "Skyr / Icelandic yogurt", category: "dairy", estimatedUnitCost: 1.25, unit: "cup", commonPackageSize: "17.6 oz (~$5)", shelfLifeDays: 21 },
  { id: "slivered-almonds", name: "Slivered almonds", category: "protein", estimatedUnitCost: 0.70, unit: "1/4 cup", commonPackageSize: "6 oz (~$5)", shelfLifeDays: 180 },
  { id: "smoked-haddock", name: "Smoked haddock", category: "protein", estimatedUnitCost: 3.00, unit: "serving", commonPackageSize: "1 lb (~$9)", shelfLifeDays: 7 },
  { id: "smoked-pork-belly", name: "Smoked pork belly", category: "protein", estimatedUnitCost: 2.50, unit: "serving", commonPackageSize: "1 lb (~$10)", shelfLifeDays: 7 },
  { id: "smoked-sausage", name: "Smoked sausage", category: "protein", estimatedUnitCost: 1.25, unit: "serving", commonPackageSize: "14 oz (~$5)", shelfLifeDays: 14 },
  { id: "sour-rye-starter", name: "Rye sourdough starter", category: "spice", estimatedUnitCost: 0.50, unit: "tbsp", commonPackageSize: "homemade", shelfLifeDays: 30 },
  { id: "sweet-paprika", name: "Sweet paprika", category: "spice", estimatedUnitCost: 0.25, unit: "tsp", commonPackageSize: "2 oz (~$3)", shelfLifeDays: 730 },
  { id: "sweet-soy-sauce", name: "Sweet soy sauce", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "10 oz (~$4)", shelfLifeDays: 365 },
  { id: "tamarind", name: "Tamarind paste", category: "condiment", estimatedUnitCost: 0.71, unit: "tbsp", commonPackageSize: "7 oz (~$5)", shelfLifeDays: 365 },
  { id: "tarragon", name: "Fresh tarragon", category: "vegetable", estimatedUnitCost: 0.35, unit: "tbsp", commonPackageSize: "0.5 oz (~$2.75)", shelfLifeDays: 5 },
  { id: "tofu-puffs", name: "Tofu puffs", category: "protein", estimatedUnitCost: 0.20, unit: "piece", commonPackageSize: "10 oz (~$4)", shelfLifeDays: 14, tags: ["vegan"] },
  { id: "tomatillos", name: "Tomatillos", category: "vegetable", estimatedUnitCost: 0.50, unit: "tomatillo", commonPackageSize: "11 oz (~$2.50)", shelfLifeDays: 14 },
  { id: "turkey-bacon", name: "Turkey bacon", category: "protein", estimatedUnitCost: 0.45, unit: "slice", commonPackageSize: "12 oz (~$5)", shelfLifeDays: 14 },
  { id: "turkey-breast", name: "Turkey breast", category: "protein", estimatedUnitCost: 1.50, unit: "serving", commonPackageSize: "1 lb (~$6)", shelfLifeDays: 3 },
  { id: "turkey-gravy", name: "Turkey gravy", category: "canned", estimatedUnitCost: 1.50, unit: "can", commonPackageSize: "12 oz (~$1.50)", shelfLifeDays: 730 },
  { id: "turnip", name: "Turnip", category: "vegetable", estimatedUnitCost: 0.50, unit: "turnip", commonPackageSize: "single (~$0.50)", shelfLifeDays: 30 },
  { id: "umeboshi", name: "Umeboshi (pickled plum)", category: "condiment", estimatedUnitCost: 0.75, unit: "each", commonPackageSize: "10-pack (~$7.50)", shelfLifeDays: 365 },
  { id: "vermicelli", name: "Vermicelli", category: "grain", estimatedUnitCost: 0.38, unit: "serving", commonPackageSize: "1 lb (~$1.50)", shelfLifeDays: 365 },
  { id: "vodka", name: "Vodka", category: "condiment", estimatedUnitCost: 0.75, unit: "oz", commonPackageSize: "750ml (~$18)", shelfLifeDays: 730 },
  { id: "wakame", name: "Dried wakame", category: "vegetable", estimatedUnitCost: 0.50, unit: "tsp", commonPackageSize: "1 oz (~$5)", shelfLifeDays: 365 },
  { id: "water", name: "Water", category: "condiment", estimatedUnitCost: 0.00, unit: "cup", commonPackageSize: "tap water", shelfLifeDays: 1 },
  { id: "white-wine", name: "White wine (cooking)", category: "condiment", estimatedUnitCost: 0.32, unit: "tbsp", commonPackageSize: "750ml (~$8)", shelfLifeDays: 30 },
  { id: "whole-wheat-buns", name: "Whole wheat buns", category: "grain", estimatedUnitCost: 0.60, unit: "bun", commonPackageSize: "8 ct (~$4.50)", shelfLifeDays: 7 },
  { id: "whole-wheat-couscous", name: "Whole wheat couscous", category: "grain", estimatedUnitCost: 1.50, unit: "cup-dry", commonPackageSize: "12 oz (~$3)", shelfLifeDays: 365 },
  { id: "wild-rice-blend", name: "Wild rice blend", category: "grain", estimatedUnitCost: 0.60, unit: "cup", commonPackageSize: "1 lb (~$5)", shelfLifeDays: 365 },
  { id: "yellow-split-peas", name: "Yellow split peas", category: "grain", estimatedUnitCost: 1.09, unit: "cup-dry", commonPackageSize: "1 lb (~$2.50)", shelfLifeDays: 730 },
];

// Alias map: maps alternative ingredient IDs used in macro recipe batches to the
// canonical ID already in INGREDIENTS. The value is the canonical id string.
const INGREDIENT_ALIASES: Record<string, string> = {
  // Eggs
  "egg": "eggs",
  "egg-whites": "eggs",
  "egg-yolk": "eggs",
  // Ginger
  "ginger-fresh": "ginger",
  // Produce plurals / synonyms
  "red-onion": "onion",
  "pearl-onions": "onion",
  "green-onion": "scallion",
  "green-onions": "scallion",
  "scallions": "scallion",
  "shallots": "shallot",
  "leeks": "leek",
  "carrots": "carrot",
  "radishes": "radish",
  "parsnip": "parsnips",
  "potatoes": "potato",
  "boiled-potatoes": "potato",
  "mashed-potato": "potato",
  "cherry-tomatoes": "tomato",
  "tomatoes": "tomato",
  "ripe-tomatoes": "tomato",
  "diced-tomatoes": "tomato",
  "tomatoes-diced": "tomato",
  "roma-tomatoes": "tomato",
  "baby-spinach": "spinach",
  "mixed-greens": "spinach",
  "microgreens": "spinach",
  "romaine": "lettuce",
  "romaine-lettuce": "lettuce",
  "iceberg-lettuce": "lettuce",
  "butter-lettuce": "lettuce",
  "purple-cabbage": "cabbage",
  "jalapeño": "jalapeno",
  "chipotle": "jalapeno",
  "chipotle-peppers": "jalapeno",
  "chipotle-in-adobo": "jalapeno",
  "scotch-bonnet": "jalapeno",
  "green-chili": "jalapeno",
  "chili-pepper": "jalapeno",
  "ancho-chili": "chili-powder",
  "dried-ancho-chili": "chili-powder",
  "dried-chilies": "chili-powder",
  "dried-chiles": "chili-powder",
  "red-chili": "jalapeno",
  "green-bell-pepper": "bell-pepper",
  "poblano": "bell-pepper",
  "corn-on-cob": "corn",
  "sweet-plantain": "plantain",
  "cucumber-diced": "cucumber",
  // Tomato products
  "crushed-tomatoes": "crushed-tomato",
  // Dairy
  "plain-skyr": "skyr",
  "yogurt": "plain-yogurt",
  "whole-milk": "milk",
  "buttermilk": "milk",
  "cream": "heavy-cream",
  "cooking-cream": "heavy-cream",
  "ricotta-cheese": "ricotta",
  "gruyere-cheese": "gruyere",
  "cheddar": "cheese",
  "cheddar-cheese": "cheese",
  "swiss-cheese": "cheese",
  "monterey-jack": "cheese",
  "american-cheese": "cheese",
  "mozzarella-cheese": "mozzarella",
  "feta-cheese": "feta",
  "cotija-cheese": "cotija",
  "provolone-cheese": "provolone",
  // Grains / pasta aliases
  "white-rice": "rice",
  "jasmine-rice": "jasmine-rice",
  "basmati-rice": "basmati-rice",
  "cooked-rice": "rice",
  "cooked-white-rice": "rice",
  "sushi-rice": "sushi-rice",
  "glutinous-rice": "rice",
  "wild-rice": "wild-rice-blend",
  "arborio-rice": "arborio-rice",
  "rolled-oats": "oats",
  "spaghetti": "pasta",
  "linguine": "pasta",
  "penne": "pasta",
  "rigatoni": "pasta",
  "orzo-pasta": "pasta",
  "elbow-macaroni": "elbow-pasta",
  "bucatini": "pasta",
  "ditalini-pasta": "pasta",
  "short-pasta": "pasta",
  "small-pasta": "pasta",
  "whole-wheat-pasta": "pasta",
  "udon-noodles": "udon",
  "ramen-noodles": "ramen",
  "cooked-farro": "farro",
  // Bread / wraps
  "flour-tortilla": "tortilla",
  "flour-tortillas": "tortilla",
  "tortillas": "tortilla",
  "corn-tortillas": "tortilla",
  "whole-wheat-tortilla": "tortilla",
  "whole-wheat-tortillas": "tortilla",
  "whole-wheat-bread": "bread",
  "white-bread": "bread",
  "sourdough-bread": "bread",
  "stale-bread": "bread",
  "stale-sourdough": "bread",
  "brioche-bread": "bread",
  "rye-bread": "bread",
  "danish-rye-bread": "bread",
  "toast": "bread",
  "bread-rolls": "bread",
  "pita-bread": "pita",
  "bagels": "bagel",
  "whole-grain-bagel": "bagel",
  "english-muffins": "english-muffin",
  "baguette": "bread",
  // Flour
  "all-purpose-flour": "flour",
  "whole-wheat-flour": "flour",
  "rice-flour": "flour",
  "wheat-starch": "flour",
  // Oils
  "cooking-oil": "vegetable-oil",
  "oil": "vegetable-oil",
  "palm-oil": "vegetable-oil",
  // Broth
  "vegetable-broth": "veggie-broth",
  // Pantry
  "canned-tuna": "tuna",
  "tuna-canned": "tuna",
  "tuna-fresh": "tuna",
  "canned-sardines": "sardines",
  "vanilla-extract": "vanilla",
  // Sweeteners
  "palm-sugar": "brown-sugar",
  // Condiments
  "dijon-mustard": "dijon",
  "worcestershire-sauce": "worcestershire",
  "hoisin-sauce": "hoisin",
  "miso-paste": "miso",
  "marinara-sauce": "marinara-sauce",
  "doenjang": "doenjang-paste",
  "kecap-manis": "kecap-manis",
  "sweet-soy-sauce": "sweet-soy-sauce",
  "dry-white-wine": "white-wine",
  "stout-beer": "beer",
  "white-vinegar": "vinegar",
  "balsamic-vinegar": "balsamic",
  "massaman-curry-paste": "massaman-paste",
  "pickle": "pickles",
  "green-olives": "olives",
  // Salt
  "kosher-salt": "salt",
  "black-salt": "salt",
  // Spices
  "coriander-seed": "coriander",
  "cloves-whole": "cloves",
  "bay-leaf": "bay-leaves",
  "sichuan-peppercorn": "cloves",
  "sichuan-peppercorns": "cloves",
  "five-spice-powder": "chinese-5-spice",
  // Herbs
  "fresh-basil": "basil",
  "fresh-parsley": "parsley",
  "fresh-mint": "mint",
  "fresh-dill": "dill",
  "fresh-rosemary": "rosemary",
  "fresh-berries": "frozen-berries",
  "mixed-berries": "frozen-berries",
  "berries": "frozen-berries",
  // Mushrooms
  "mushrooms": "mushroom",
  "cremini-mushrooms": "mushroom",
  "shiitake": "mushroom",
  "shiitake-mushrooms": "mushroom",
  "dried-mushrooms": "mushroom",
  "dried-porcini": "mushroom",
  // Protein aliases
  "extra-firm-tofu": "tofu",
  "firm-tofu": "tofu",
  "silken-tofu": "tofu",
  "salmon-fillet": "salmon",
  "tilapia-fillet": "tilapia",
  "white-fish": "tilapia",
  "white-fish-fillet": "tilapia",
  "turkey-sausage": "italian-sausage",
  "pork-sausage": "sausage",
  "breakfast-sausage": "sausage",
  "serrano-ham": "ham",
  // Legumes
  "dried-white-beans": "white-beans",
  "white-peas": "white-beans",
  "clams-canned": "canned-clams",
  // Produce
  "frozen-vegetables": "frozen-veg",
  "shredded-coconut": "coconut-flakes",
  "toasted-coconut": "coconut-flakes",
  // Misc
  "lemon-juice": "lemon",
  "orange-juice": "orange-juice",
  "apple-juice": "apple-juice",
  "pineapple-chunks": "pineapple",
  "parmesan-cheese": "parmesan",
  "frozen-acai": "acai-pack",
  "mini-yogurt": "plain-yogurt",
  "cream-of-chicken": "chicken-broth",
  "noodles": "udon",
  "pasta-water": "water",
  "mint-chutney": "mint",
  "rye-granola": "oats",
  "cheese-tortellini": "pasta",
  "fried-garlic": "garlic",
  "fried-shallots": "shallot",
  "Thai-chili": "thai-chili",
  "dates": "medjool-dates",
  "prunes": "raisins",
  "red-grapes": "grapes",
  "turkey-breast-deli": "deli-turkey",
  "everything-bagel-seasoning": "everything-bagel",
  "wonton-strips": "wonton-wrappers",
};

export const INGREDIENT_MAP = new Map<string, Ingredient>([
  ...INGREDIENTS.map((i) => [i.id, i] as [string, Ingredient]),
  ...WEB_INGREDIENTS.map((i) => [i.id, i] as [string, Ingredient]),
  ...Object.entries(INGREDIENT_ALIASES).flatMap(([alias, canonical]) => {
    const ingredient = INGREDIENTS.find((i) => i.id === canonical);
    return ingredient ? [[alias, ingredient] as [string, Ingredient]] : [];
  }),
]);


export const CATEGORY_LABEL: Record<string, string> = {
  grain: "Grains",
  protein: "Protein",
  vegetable: "Vegetables",
  fruit: "Fruit",
  dairy: "Dairy",
  canned: "Canned goods",
  condiment: "Condiments",
  spice: "Spices",
  frozen: "Frozen",
  snack: "Snacks/misc",
};

export const QUICK_ADD_STAPLES = [
  "rice",
  "pasta",
  "eggs",
  "bread",
  "peanut-butter",
  "tuna",
  "black-beans",
  "lentils",
  "oats",
  "frozen-veg",
  "ramen",
  "tortilla",
  "chicken-breast",
  "tofu",
  "soy-sauce",
  "garlic",
  "onion",
];
