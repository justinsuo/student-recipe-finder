import type { Ingredient } from "@/lib/types";

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
];

export const INGREDIENT_MAP = new Map(INGREDIENTS.map((i) => [i.id, i]));

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
