// Per-ingredient nutrition. The reference quantity for each entry is exactly
// the `unit` declared on the matching INGREDIENTS row in `ingredients.ts`
// (e.g. for rice, unit="cup" → these macros are for 1 cup cooked rice;
// for soy-sauce, unit="tbsp" → 1 tbsp; for eggs, unit="egg" → 1 large egg).
// Numbers are USDA / Nutrition-Facts-label averages, rounded.
//
// Used by `nutritionEngine.ts` to sum recipe macros from the ingredient
// quantities (the same pattern as the pricing engine).
export interface NutritionPerUnit {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  /**
   * How well this row reflects the actual ingredient as commonly used.
   * - high:   USDA value for a well-defined unit (egg, oz, can).
   * - medium: derived from a typical package label / common conversion.
   * - low:    rough estimate (mixed-veg blends, fresh herbs by tbsp).
   */
  confidence: "high" | "medium" | "low";
}

export const INGREDIENT_NUTRITION: Record<string, NutritionPerUnit> = {
  // ===== Grains / starches =====
  rice: { calories: 205, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6, confidence: "high" }, // 1 cup cooked
  pasta: { calories: 200, protein: 7.5, carbs: 42, fat: 1.2, fiber: 2.5, confidence: "high" }, // 1 serving (2 oz dry)
  ramen: { calories: 380, protein: 8, carbs: 52, fat: 14, fiber: 2, confidence: "high" }, // 1 pack w/ seasoning
  bread: { calories: 80, protein: 3, carbs: 14, fat: 1, fiber: 1, confidence: "high" }, // 1 slice
  tortilla: { calories: 140, protein: 4, carbs: 22, fat: 4, fiber: 1, confidence: "high" }, // 1 medium flour
  oats: { calories: 300, protein: 10, carbs: 54, fat: 5, fiber: 8, confidence: "high" }, // 1 cup rolled, dry
  "tortilla-chips": { calories: 140, protein: 2, carbs: 19, fat: 7, fiber: 1, confidence: "high" }, // 1 serving (~10 chips)

  // ===== Proteins =====
  eggs: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5, confidence: "high" }, // 1 large
  "chicken-breast": { calories: 180, protein: 35, carbs: 0, fat: 4, confidence: "high" }, // 1 serving ~4 oz cooked
  "ground-beef": { calories: 280, protein: 22, carbs: 0, fat: 21, confidence: "high" }, // 1 serving ~4 oz 80/20 cooked
  tofu: { calories: 130, protein: 14, carbs: 3, fat: 7, fiber: 1, confidence: "high" }, // 1 serving ~1/3 block firm
  "peanut-butter": { calories: 95, protein: 4, carbs: 3.5, fat: 8, fiber: 1, confidence: "high" }, // 1 tbsp
  "greek-yogurt": { calories: 130, protein: 22, carbs: 9, fat: 0, confidence: "high" }, // 1 cup nonfat
  lentils: { calories: 670, protein: 50, carbs: 115, fat: 2, fiber: 58, confidence: "high" }, // 1 cup dry
  chickpeas: { calories: 360, protein: 18, carbs: 60, fat: 6, fiber: 18, confidence: "high" }, // 1 can drained
  "black-beans": { calories: 340, protein: 22, carbs: 60, fat: 1, fiber: 24, confidence: "high" }, // 1 can drained
  tuna: { calories: 100, protein: 22, carbs: 0, fat: 1, confidence: "high" }, // 1 can (5 oz) drained

  // ===== Vegetables =====
  onion: { calories: 45, protein: 1, carbs: 11, fat: 0, fiber: 2, confidence: "high" }, // 1 medium
  garlic: { calories: 4, protein: 0.2, carbs: 1, fat: 0, confidence: "high" }, // 1 clove
  potato: { calories: 160, protein: 4, carbs: 37, fat: 0, fiber: 4, confidence: "high" }, // 1 medium russet
  carrot: { calories: 25, protein: 0.6, carbs: 6, fat: 0, fiber: 1.7, confidence: "high" }, // 1 medium
  spinach: { calories: 7, protein: 0.9, carbs: 1, fat: 0, fiber: 0.7, confidence: "high" }, // 1 cup raw
  tomato: { calories: 22, protein: 1, carbs: 5, fat: 0, fiber: 1.5, confidence: "high" }, // 1 medium
  "bell-pepper": { calories: 30, protein: 1, carbs: 7, fat: 0, fiber: 2.5, confidence: "high" }, // 1 medium
  broccoli: { calories: 30, protein: 2.5, carbs: 6, fat: 0, fiber: 2.4, confidence: "high" }, // 1 cup
  scallion: { calories: 5, protein: 0.3, carbs: 1, fat: 0, confidence: "high" }, // 1 stalk
  "frozen-veg": { calories: 60, protein: 3, carbs: 12, fat: 0, fiber: 3, confidence: "medium" }, // 1 cup mixed
  "frozen-corn": { calories: 130, protein: 4, carbs: 30, fat: 1, fiber: 3, confidence: "high" }, // 1 cup

  // ===== Fruit =====
  banana: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3, confidence: "high" }, // 1 medium
  apple: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, confidence: "high" }, // 1 medium
  lemon: { calories: 17, protein: 0.6, carbs: 5, fat: 0, confidence: "high" }, // 1 medium
  "frozen-berries": { calories: 70, protein: 1, carbs: 17, fat: 0, fiber: 4, confidence: "high" }, // 1 cup

  // ===== Dairy =====
  cheese: { calories: 110, protein: 7, carbs: 1, fat: 9, confidence: "high" }, // 1/4 cup shredded
  milk: { calories: 150, protein: 8, carbs: 12, fat: 8, confidence: "high" }, // 1 cup whole
  butter: { calories: 100, protein: 0, carbs: 0, fat: 11, confidence: "high" }, // 1 tbsp

  // ===== Canned pantry =====
  "tomato-sauce": { calories: 60, protein: 3, carbs: 12, fat: 0, fiber: 3, confidence: "high" }, // 1 cup
  "crushed-tomato": { calories: 150, protein: 7, carbs: 32, fat: 1, fiber: 8, confidence: "high" }, // 1 can (28oz)
  pesto: { calories: 80, protein: 1, carbs: 1, fat: 8, confidence: "high" }, // 1 tbsp
  "coconut-milk": { calories: 720, protein: 7, carbs: 11, fat: 72, confidence: "high" }, // 1 full-fat can

  // ===== Condiments / oils =====
  "soy-sauce": { calories: 8, protein: 1, carbs: 1, fat: 0, confidence: "high" }, // 1 tbsp
  "olive-oil": { calories: 119, protein: 0, carbs: 0, fat: 13.5, confidence: "high" }, // 1 tbsp
  "vegetable-oil": { calories: 120, protein: 0, carbs: 0, fat: 14, confidence: "high" }, // 1 tbsp
  honey: { calories: 64, protein: 0, carbs: 17, fat: 0, confidence: "high" }, // 1 tbsp
  mayonnaise: { calories: 90, protein: 0, carbs: 0, fat: 10, confidence: "high" }, // 1 tbsp
  sriracha: { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" }, // 1 tsp

  // ===== Spices =====
  // Spices are tiny — calories ~0 except for some baking items.
  salt: { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // 1 tsp
  pepper: { calories: 6, protein: 0, carbs: 1.5, fat: 0, confidence: "high" }, // 1 tsp
  "chili-powder": { calories: 8, protein: 0, carbs: 1.5, fat: 0, confidence: "high" },
  cumin: { calories: 8, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "curry-powder": { calories: 7, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  paprika: { calories: 6, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "italian-seasoning": { calories: 4, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  ginger: { calories: 2, protein: 0, carbs: 0.5, fat: 0, confidence: "high" },

  // ===== Snacks =====
  salsa: { calories: 20, protein: 0.5, carbs: 5, fat: 0, confidence: "high" }, // 1/4 cup
  feta: { calories: 100, protein: 5, carbs: 1, fat: 8, confidence: "high" }, // 1/4 cup

  // ===== Expanded grains =====
  quinoa: { calories: 626, protein: 24, carbs: 109, fat: 10, fiber: 12, confidence: "high" }, // 1 cup dry
  couscous: { calories: 650, protein: 22, carbs: 134, fat: 1, fiber: 8, confidence: "high" }, // 1 cup dry
  "brown-rice": { calories: 215, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, confidence: "high" }, // 1 cup cooked
  bagel: { calories: 280, protein: 11, carbs: 56, fat: 1.5, fiber: 2, confidence: "high" }, // 1 plain
  "english-muffin": { calories: 140, protein: 5, carbs: 27, fat: 1, fiber: 2, confidence: "high" },
  pita: { calories: 165, protein: 5, carbs: 33, fat: 1, fiber: 1, confidence: "high" },
  flour: { calories: 455, protein: 13, carbs: 95, fat: 1.2, fiber: 3, confidence: "high" }, // 1 cup AP
  "rolled-oats-instant": { calories: 160, protein: 4, carbs: 32, fat: 2, fiber: 3, confidence: "high" }, // 1 packet
  "rice-noodles": { calories: 195, protein: 4, carbs: 44, fat: 0.5, fiber: 1, confidence: "high" },
  "soba-noodles": { calories: 200, protein: 8, carbs: 43, fat: 0, fiber: 2, confidence: "high" },

  // ===== Expanded proteins =====
  "chicken-thighs": { calories: 220, protein: 25, carbs: 0, fat: 13, confidence: "high" }, // 1 serving ~4 oz cooked w/ skin off
  "ground-turkey": { calories: 190, protein: 22, carbs: 0, fat: 11, confidence: "high" }, // 1 serving ~4 oz 93/7 cooked
  salmon: { calories: 230, protein: 25, carbs: 0, fat: 14, confidence: "high" }, // 1 serving ~4 oz cooked
  shrimp: { calories: 100, protein: 24, carbs: 0, fat: 1, confidence: "high" }, // 1 serving ~4 oz cooked
  bacon: { calories: 45, protein: 3, carbs: 0, fat: 3.5, confidence: "high" }, // 1 cooked slice
  sausage: { calories: 290, protein: 14, carbs: 1, fat: 25, confidence: "high" }, // 1 serving ~4 oz cooked
  "hot-dog": { calories: 150, protein: 6, carbs: 2, fat: 13, confidence: "high" },
  "deli-turkey": { calories: 90, protein: 16, carbs: 2, fat: 2, confidence: "high" }, // 1 serving ~2 oz
  tempeh: { calories: 200, protein: 19, carbs: 8, fat: 11, fiber: 5, confidence: "high" }, // 1 serving ~3 oz
  edamame: { calories: 190, protein: 17, carbs: 14, fat: 8, fiber: 8, confidence: "high" }, // 1 cup shelled
  "white-beans": { calories: 350, protein: 22, carbs: 64, fat: 1, fiber: 18, confidence: "high" }, // 1 can drained
  "kidney-beans": { calories: 340, protein: 22, carbs: 62, fat: 1, fiber: 22, confidence: "high" }, // 1 can drained
  "refried-beans": { calories: 380, protein: 24, carbs: 64, fat: 4, fiber: 22, confidence: "high" }, // 1 can
  "canned-chicken": { calories: 240, protein: 50, carbs: 0, fat: 4, confidence: "high" }, // 1 can (12 oz)
  sardines: { calories: 190, protein: 23, carbs: 0, fat: 10, confidence: "high" }, // 1 can
  almonds: { calories: 205, protein: 7.5, carbs: 7.5, fat: 18, fiber: 4.5, confidence: "high" }, // 1/4 cup
  walnuts: { calories: 195, protein: 4.5, carbs: 4, fat: 19.5, fiber: 2, confidence: "high" }, // 1/4 cup
  cashews: { calories: 200, protein: 5.5, carbs: 11, fat: 16, fiber: 1, confidence: "high" }, // 1/4 cup
  "protein-powder": { calories: 120, protein: 24, carbs: 3, fat: 1.5, confidence: "high" }, // 1 scoop whey

  // ===== Expanded vegetables =====
  celery: { calories: 6, protein: 0.3, carbs: 1.2, fat: 0, fiber: 0.6, confidence: "high" }, // 1 stalk
  cucumber: { calories: 30, protein: 1.5, carbs: 7, fat: 0, fiber: 2, confidence: "high" }, // 1 medium
  lettuce: { calories: 50, protein: 4, carbs: 10, fat: 0.5, fiber: 6, confidence: "high" }, // 1 head romaine
  kale: { calories: 33, protein: 3, carbs: 6, fat: 0.6, fiber: 1.3, confidence: "high" }, // 1 cup chopped
  cabbage: { calories: 22, protein: 1, carbs: 5, fat: 0, fiber: 2.2, confidence: "high" }, // 1 cup shredded
  zucchini: { calories: 33, protein: 2.4, carbs: 6, fat: 0.6, fiber: 2, confidence: "high" }, // 1 medium
  mushroom: { calories: 22, protein: 3, carbs: 3, fat: 0.3, fiber: 1, confidence: "high" }, // 1 cup sliced
  corn: { calories: 80, protein: 3, carbs: 19, fat: 1.1, fiber: 2.4, confidence: "high" }, // 1 ear
  "sweet-potato": { calories: 105, protein: 2, carbs: 24, fat: 0, fiber: 4, confidence: "high" }, // 1 medium
  jalapeno: { calories: 4, protein: 0.2, carbs: 1, fat: 0, confidence: "high" }, // 1 pepper
  avocado: { calories: 240, protein: 3, carbs: 12, fat: 22, fiber: 10, confidence: "high" }, // 1 whole
  "frozen-spinach": { calories: 30, protein: 4, carbs: 4, fat: 0, fiber: 3, confidence: "high" }, // 1 cup
  "frozen-broccoli": { calories: 30, protein: 2.5, carbs: 6, fat: 0, fiber: 2.5, confidence: "high" }, // 1 cup
  "ginger-paste": { calories: 2, protein: 0, carbs: 0.5, fat: 0, confidence: "high" }, // 1 tsp

  // ===== Expanded fruit =====
  orange: { calories: 62, protein: 1.2, carbs: 15.4, fat: 0, fiber: 3, confidence: "high" }, // 1 medium
  strawberries: { calories: 50, protein: 1, carbs: 12, fat: 0.5, fiber: 3, confidence: "high" }, // 1 cup sliced
  blueberries: { calories: 85, protein: 1, carbs: 22, fat: 0.5, fiber: 3.6, confidence: "high" }, // 1 cup
  grapes: { calories: 60, protein: 0.6, carbs: 16, fat: 0.3, fiber: 0.8, confidence: "high" }, // 1 cup
  raisins: { calories: 110, protein: 1, carbs: 30, fat: 0, fiber: 1, confidence: "high" }, // 1/4 cup
  "frozen-mango": { calories: 100, protein: 1, carbs: 25, fat: 0, fiber: 2.6, confidence: "high" }, // 1 cup

  // ===== Expanded dairy =====
  "cottage-cheese": { calories: 100, protein: 14, carbs: 5, fat: 2.5, confidence: "high" }, // 1/2 cup low-fat
  "cream-cheese": { calories: 50, protein: 1, carbs: 1, fat: 5, confidence: "high" }, // 1 tbsp
  "sour-cream": { calories: 30, protein: 0.5, carbs: 0.5, fat: 3, confidence: "high" }, // 1 tbsp
  parmesan: { calories: 22, protein: 2, carbs: 0, fat: 1.5, confidence: "high" }, // 1 tbsp grated
  mozzarella: { calories: 85, protein: 6, carbs: 1, fat: 6, confidence: "high" }, // 1/4 cup shredded
  "almond-milk": { calories: 60, protein: 1, carbs: 8, fat: 2.5, confidence: "high" }, // 1 cup vanilla unsweetened
  "oat-milk": { calories: 120, protein: 3, carbs: 16, fat: 5, confidence: "high" }, // 1 cup

  // ===== Expanded condiments =====
  ketchup: { calories: 20, protein: 0, carbs: 5, fat: 0, confidence: "high" }, // 1 tbsp
  mustard: { calories: 3, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // 1 tsp
  "bbq-sauce": { calories: 30, protein: 0, carbs: 8, fat: 0, confidence: "high" }, // 1 tbsp
  ranch: { calories: 65, protein: 0, carbs: 1, fat: 7, confidence: "high" }, // 1 tbsp
  vinegar: { calories: 3, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "rice-vinegar": { calories: 3, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "sesame-oil": { calories: 40, protein: 0, carbs: 0, fat: 4.5, confidence: "high" }, // 1 tsp
  hoisin: { calories: 35, protein: 0.5, carbs: 7, fat: 0.5, confidence: "high" }, // 1 tbsp
  "fish-sauce": { calories: 5, protein: 1, carbs: 1, fat: 0, confidence: "high" }, // 1 tsp
  miso: { calories: 35, protein: 2, carbs: 4, fat: 1, confidence: "high" }, // 1 tbsp
  tahini: { calories: 90, protein: 3, carbs: 3, fat: 8, fiber: 1.5, confidence: "high" }, // 1 tbsp
  "maple-syrup": { calories: 52, protein: 0, carbs: 13, fat: 0, confidence: "high" }, // 1 tbsp
  jam: { calories: 50, protein: 0, carbs: 13, fat: 0, confidence: "high" }, // 1 tbsp
  nutella: { calories: 100, protein: 1, carbs: 11, fat: 6, confidence: "high" }, // 1 tbsp

  // ===== Expanded spices / baking =====
  sugar: { calories: 50, protein: 0, carbs: 13, fat: 0, confidence: "high" }, // 1 tbsp white
  "brown-sugar": { calories: 50, protein: 0, carbs: 13, fat: 0, confidence: "high" },
  vanilla: { calories: 12, protein: 0, carbs: 0.5, fat: 0, confidence: "high" }, // 1 tsp
  "baking-soda": { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "baking-powder": { calories: 2, protein: 0, carbs: 0.6, fat: 0, confidence: "high" },
  cocoa: { calories: 12, protein: 1, carbs: 3, fat: 0.7, fiber: 1.8, confidence: "high" }, // 1 tbsp unsweetened
  cinnamon: { calories: 6, protein: 0, carbs: 2, fat: 0, fiber: 1, confidence: "high" },
  oregano: { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  thyme: { calories: 4, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "bay-leaf": { calories: 2, protein: 0, carbs: 0.5, fat: 0, confidence: "high" },
  "red-pepper-flakes": { calories: 6, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "garlic-powder": { calories: 10, protein: 0.5, carbs: 2, fat: 0, confidence: "high" },
  "onion-powder": { calories: 8, protein: 0, carbs: 2, fat: 0, confidence: "high" },

  // ===== Expanded snacks =====
  crackers: { calories: 130, protein: 2, carbs: 22, fat: 4, confidence: "high" }, // 1 serving
  "popcorn-kernels": { calories: 170, protein: 5, carbs: 33, fat: 2, fiber: 7, confidence: "high" }, // 1/4 cup
  chocolate: { calories: 170, protein: 2, carbs: 13, fat: 12, fiber: 3, confidence: "high" }, // 1 oz dark
  "granola-bar": { calories: 190, protein: 5, carbs: 28, fat: 7, fiber: 3, confidence: "high" },
  chips: { calories: 160, protein: 2, carbs: 15, fat: 10, fiber: 1, confidence: "high" }, // 1 serving

  // ===== Recipe-specific extras =====
  hummus: { calories: 100, protein: 4, carbs: 8, fat: 6, fiber: 2, confidence: "high" }, // 1/4 cup
  kimchi: { calories: 15, protein: 1, carbs: 3, fat: 0, fiber: 1, confidence: "high" }, // 1/4 cup
  "salsa-verde": { calories: 20, protein: 0.5, carbs: 5, fat: 0, confidence: "high" }, // 1/4 cup
  "frozen-peas": { calories: 70, protein: 5, carbs: 13, fat: 0, fiber: 4, confidence: "high" }, // 1 cup
  "frozen-corn-kernels": { calories: 130, protein: 4, carbs: 30, fat: 1, fiber: 3, confidence: "high" },
  "split-peas": { calories: 670, protein: 47, carbs: 117, fat: 2, fiber: 50, confidence: "high" }, // 1 cup dry
  "tortilla-chips-2": { calories: 140, protein: 2, carbs: 19, fat: 7, fiber: 1, confidence: "high" },
  "chicken-broth": { calories: 15, protein: 1, carbs: 1, fat: 0.5, confidence: "high" }, // 1 cup
  "veggie-broth": { calories: 15, protein: 1, carbs: 3, fat: 0, confidence: "high" },
  "tomato-soup-can": { calories: 200, protein: 5, carbs: 40, fat: 3, confidence: "high" }, // 1 can condensed
  "canned-chili": { calories: 360, protein: 16, carbs: 40, fat: 14, fiber: 12, confidence: "high" }, // 1 can
  "canned-salmon": { calories: 240, protein: 34, carbs: 0, fat: 12, confidence: "high" }, // 1 can (6 oz)
  "teriyaki-sauce": { calories: 35, protein: 1, carbs: 8, fat: 0, confidence: "high" }, // 1 tbsp
  "taco-seasoning": { calories: 30, protein: 1, carbs: 5, fat: 1, confidence: "high" }, // 1 packet
  "curry-paste": { calories: 30, protein: 1, carbs: 4, fat: 1, confidence: "high" }, // 1 tbsp
  "chili-oil": { calories: 40, protein: 0, carbs: 0, fat: 4.5, confidence: "high" }, // 1 tsp
  pepperoni: { calories: 140, protein: 6, carbs: 0, fat: 13, confidence: "high" }, // 1 oz
  "rice-cakes": { calories: 35, protein: 1, carbs: 7, fat: 0, confidence: "high" }, // 1 cake
  granola: { calories: 240, protein: 6, carbs: 36, fat: 9, fiber: 4, confidence: "high" }, // 1/2 cup
  udon: { calories: 220, protein: 7, carbs: 47, fat: 1, confidence: "high" }, // 1 serving
  turmeric: { calories: 8, protein: 0, carbs: 1.5, fat: 0, confidence: "high" },
  "hot-sauce": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // 1 tsp
  "gravy-mix": { calories: 70, protein: 1, carbs: 14, fat: 1, confidence: "high" }, // 1 packet

  // ===== Comprehensive flavor expansion (mostly low-calorie spices) =====
  "white-pepper": { calories: 6, protein: 0, carbs: 1.5, fat: 0, confidence: "high" },
  "smoked-paprika": { calories: 6, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  cayenne: { calories: 6, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "coriander-seed": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "garam-masala": { calories: 8, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  nutmeg: { calories: 12, protein: 0, carbs: 1, fat: 0.8, confidence: "high" },
  "cloves-ground": { calories: 7, protein: 0, carbs: 1.5, fat: 0, confidence: "high" },
  allspice: { calories: 5, protein: 0, carbs: 1.5, fat: 0, confidence: "high" },
  "ginger-ground": { calories: 6, protein: 0, carbs: 1.5, fat: 0, confidence: "high" },
  "mustard-powder": { calories: 15, protein: 1, carbs: 1, fat: 1, confidence: "high" },
  "sage-dried": { calories: 2, protein: 0, carbs: 0.5, fat: 0, confidence: "high" },
  "parsley-dried": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "dill-dried": { calories: 3, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "tarragon-dried": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "herbes-provence": { calories: 4, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "poultry-seasoning": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "lemon-pepper": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "seasoned-salt": { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "old-bay": { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "cajun-seasoning": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "creole-seasoning": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "ranch-seasoning": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "everything-bagel": { calories: 10, protein: 0, carbs: 1, fat: 1, confidence: "high" },
  "chinese-5-spice": { calories: 6, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  zaatar: { calories: 8, protein: 0, carbs: 1, fat: 0.5, confidence: "high" },
  sumac: { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  furikake: { calories: 10, protein: 0.5, carbs: 1, fat: 0.5, confidence: "high" },
  shichimi: { calories: 6, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  gochugaru: { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },
  "sesame-seeds": { calories: 18, protein: 0.6, carbs: 0.7, fat: 1.5, confidence: "high" }, // 1 tsp
  "black-sesame": { calories: 18, protein: 0.6, carbs: 0.7, fat: 1.5, confidence: "high" },
  "taco-seasoning-2": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" },

  // Fresh aromatics
  shallot: { calories: 20, protein: 0.7, carbs: 5, fat: 0, confidence: "high" }, // 1 shallot
  "cilantro-fresh": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // 1 tbsp
  "parsley-fresh": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "basil-fresh": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "mint-fresh": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "dill-fresh": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "rosemary-fresh": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // 1 sprig
  "thyme-fresh": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  serrano: { calories: 4, protein: 0.2, carbs: 1, fat: 0, confidence: "high" },
  habanero: { calories: 4, protein: 0.2, carbs: 1, fat: 0, confidence: "high" },
  "thai-chili": { calories: 4, protein: 0.2, carbs: 1, fat: 0, confidence: "high" },
  "lemon-zest": { calories: 2, protein: 0, carbs: 0.5, fat: 0, confidence: "high" },
  lime: { calories: 20, protein: 0.5, carbs: 7, fat: 0, confidence: "high" }, // 1 lime
  "lime-zest": { calories: 1, protein: 0, carbs: 0, fat: 0, confidence: "high" },

  // Asian / fermented sauces (tbsp)
  "low-sodium-soy": { calories: 8, protein: 1, carbs: 1, fat: 0, confidence: "high" },
  "dark-soy": { calories: 10, protein: 1, carbs: 2, fat: 0, confidence: "high" },
  tamari: { calories: 11, protein: 2, carbs: 1, fat: 0, confidence: "high" },
  "oyster-sauce": { calories: 25, protein: 1, carbs: 5, fat: 0, confidence: "high" },
  ponzu: { calories: 10, protein: 1, carbs: 2, fat: 0, confidence: "high" },
  mirin: { calories: 45, protein: 0, carbs: 9, fat: 0, confidence: "high" }, // 1 tbsp
  "chili-garlic-sauce": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" }, // 1 tsp
  "chili-crisp": { calories: 30, protein: 0, carbs: 1, fat: 3, confidence: "high" }, // 1 tsp
  laoganma: { calories: 30, protein: 0, carbs: 1, fat: 3, confidence: "high" },
  gochujang: { calories: 35, protein: 1, carbs: 7, fat: 0, confidence: "high" }, // 1 tbsp
  doenjang: { calories: 35, protein: 3, carbs: 4, fat: 1, confidence: "high" },
  "kewpie-mayo": { calories: 100, protein: 0, carbs: 0, fat: 11, confidence: "high" }, // 1 tbsp
  "red-curry-paste": { calories: 25, protein: 1, carbs: 4, fat: 0.5, confidence: "high" },
  "green-curry-paste": { calories: 25, protein: 1, carbs: 4, fat: 0.5, confidence: "high" },
  "yellow-curry-paste": { calories: 25, protein: 1, carbs: 4, fat: 0.5, confidence: "high" },

  // Other sauces
  dijon: { calories: 5, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // 1 tsp
  "yellow-mustard": { calories: 3, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  harissa: { calories: 20, protein: 0.5, carbs: 2, fat: 1.5, confidence: "high" }, // 1 tbsp
  "buffalo-sauce": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" }, // 1 tbsp
  worcestershire: { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" }, // 1 tsp
  "steak-sauce": { calories: 15, protein: 0, carbs: 4, fat: 0, confidence: "high" }, // 1 tbsp
  agave: { calories: 60, protein: 0, carbs: 16, fat: 0, confidence: "high" }, // 1 tbsp
  pico: { calories: 15, protein: 0.5, carbs: 4, fat: 0, confidence: "high" }, // 1/4 cup
  marinara: { calories: 70, protein: 2, carbs: 12, fat: 2, confidence: "high" }, // 1 cup
  "tomato-paste": { calories: 13, protein: 0.7, carbs: 3, fat: 0, confidence: "high" }, // 1 tbsp

  // Oils & fats (tbsp)
  evoo: { calories: 119, protein: 0, carbs: 0, fat: 13.5, confidence: "high" },
  "canola-oil": { calories: 124, protein: 0, carbs: 0, fat: 14, confidence: "high" },
  "toasted-sesame-oil": { calories: 40, protein: 0, carbs: 0, fat: 4.5, confidence: "high" }, // 1 tsp
  ghee: { calories: 120, protein: 0, carbs: 0, fat: 13, confidence: "high" }, // 1 tbsp
  "coconut-oil": { calories: 120, protein: 0, carbs: 0, fat: 14, confidence: "high" },
  "avocado-oil": { calories: 124, protein: 0, carbs: 0, fat: 14, confidence: "high" },
  "cooking-spray": { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // per spray

  // Vinegars
  balsamic: { calories: 14, protein: 0, carbs: 3, fat: 0, confidence: "high" }, // 1 tbsp
  "red-wine-vinegar": { calories: 3, protein: 0, carbs: 0, fat: 0, confidence: "high" },
  "apple-cider-vinegar": { calories: 3, protein: 0, carbs: 0, fat: 0, confidence: "high" },

  // Umami / broths
  msg: { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: "high" }, // 1 tsp
  "nutritional-yeast": { calories: 20, protein: 3, carbs: 2, fat: 0, fiber: 1, confidence: "high" }, // 1 tbsp
  "bouillon-cube": { calories: 10, protein: 0.5, carbs: 1, fat: 0, confidence: "high" }, // 1 cube
  "chicken-bouillon": { calories: 5, protein: 0, carbs: 1, fat: 0, confidence: "high" }, // 1 tsp
  "beef-broth": { calories: 15, protein: 3, carbs: 1, fat: 0.5, confidence: "high" }, // 1 cup
  "mushroom-powder": { calories: 5, protein: 0.5, carbs: 1, fat: 0, confidence: "high" }, // 1 tsp
  "anchovy-paste": { calories: 10, protein: 1.5, carbs: 0, fat: 0.5, confidence: "high" }, // 1 tsp

  // Sweeteners
  "white-sugar": { calories: 50, protein: 0, carbs: 13, fat: 0, confidence: "high" },
};
