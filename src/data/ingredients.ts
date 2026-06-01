import type { Ingredient } from "@/lib/types";

// Prices are rough US grocery estimates per unit, tuned so recipes yield
// realistic per-serving costs typical of student-friendly cooking ($0.50–$4).
export const INGREDIENTS: Ingredient[] = [
  // Grains
  { id: "rice", name: "Rice", category: "grain", estimatedUnitCost: 0.18, unit: "cup", commonPackageSize: "5 lb bag (~$5)", shelfLifeDays: 365, tags: ["staple", "cheap"] },
  { id: "pasta", name: "Pasta", category: "grain", estimatedUnitCost: 0.35, unit: "serving", commonPackageSize: "1 lb box (~$1.50)", shelfLifeDays: 365, tags: ["staple", "cheap"] },
  { id: "ramen", name: "Instant ramen", category: "grain", estimatedUnitCost: 0.50, unit: "pack", commonPackageSize: "pack (~$0.50)", shelfLifeDays: 365, tags: ["staple"] },
  { id: "bread", name: "Bread", category: "grain", estimatedUnitCost: 0.15, unit: "slice", commonPackageSize: "loaf (~$3)", shelfLifeDays: 7, tags: ["staple"] },
  { id: "tortilla", name: "Tortilla", category: "grain", estimatedUnitCost: 0.20, unit: "tortilla", commonPackageSize: "10 ct (~$2)", shelfLifeDays: 14 },
  { id: "oats", name: "Rolled oats", category: "grain", estimatedUnitCost: 0.20, unit: "cup", commonPackageSize: "42 oz (~$4)", shelfLifeDays: 365, tags: ["staple", "cheap"] },
  { id: "tortilla-chips", name: "Tortilla chips", category: "grain", estimatedUnitCost: 0.30, unit: "serving", commonPackageSize: "bag (~$3)", shelfLifeDays: 60 },

  // Protein
  { id: "eggs", name: "Eggs", category: "protein", estimatedUnitCost: 0.35, unit: "egg", commonPackageSize: "dozen (~$4)", shelfLifeDays: 28, tags: ["staple", "cheap", "high-protein"] },
  { id: "chicken-breast", name: "Chicken breast", category: "protein", estimatedUnitCost: 1.60, unit: "serving", commonPackageSize: "1 lb (~$4)", shelfLifeDays: 3, tags: ["high-protein"] },
  { id: "ground-beef", name: "Ground beef", category: "protein", estimatedUnitCost: 1.90, unit: "serving", commonPackageSize: "1 lb (~$6)", shelfLifeDays: 3, tags: ["high-protein"] },
  { id: "tofu", name: "Tofu", category: "protein", estimatedUnitCost: 1.10, unit: "serving", commonPackageSize: "14 oz (~$2.50)", shelfLifeDays: 7, tags: ["vegan", "high-protein"] },
  { id: "peanut-butter", name: "Peanut butter", category: "protein", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "16 oz jar (~$3)", shelfLifeDays: 180, tags: ["staple", "high-protein"] },
  { id: "greek-yogurt", name: "Greek yogurt", category: "dairy", estimatedUnitCost: 0.80, unit: "cup", commonPackageSize: "32 oz tub (~$5)", shelfLifeDays: 14, tags: ["high-protein"] },
  { id: "lentils", name: "Lentils", category: "grain", estimatedUnitCost: 0.25, unit: "cup-dry", commonPackageSize: "1 lb bag (~$2)", shelfLifeDays: 365, tags: ["staple", "cheap", "vegan"] },
  { id: "chickpeas", name: "Chickpeas (canned)", category: "canned", estimatedUnitCost: 1.10, unit: "can", commonPackageSize: "15 oz can (~$1.10)", shelfLifeDays: 730, tags: ["staple", "vegan"] },
  { id: "black-beans", name: "Black beans (canned)", category: "canned", estimatedUnitCost: 1.00, unit: "can", commonPackageSize: "15 oz can (~$1)", shelfLifeDays: 730, tags: ["staple", "vegan"] },
  { id: "tuna", name: "Canned tuna", category: "canned", estimatedUnitCost: 1.20, unit: "can", commonPackageSize: "5 oz can (~$1.20)", shelfLifeDays: 730, tags: ["high-protein", "staple"] },

  // Vegetables
  { id: "onion", name: "Onion", category: "vegetable", estimatedUnitCost: 0.40, unit: "onion", commonPackageSize: "3 lb bag (~$3)", shelfLifeDays: 30, tags: ["staple"] },
  { id: "garlic", name: "Garlic", category: "vegetable", estimatedUnitCost: 0.10, unit: "clove", commonPackageSize: "head (~$1)", shelfLifeDays: 60, tags: ["staple"] },
  { id: "potato", name: "Potato", category: "vegetable", estimatedUnitCost: 0.40, unit: "potato", commonPackageSize: "5 lb bag (~$4)", shelfLifeDays: 30, tags: ["staple", "cheap"] },
  { id: "carrot", name: "Carrot", category: "vegetable", estimatedUnitCost: 0.20, unit: "carrot", commonPackageSize: "2 lb bag (~$2)", shelfLifeDays: 30 },
  { id: "spinach", name: "Spinach", category: "vegetable", estimatedUnitCost: 0.50, unit: "cup", commonPackageSize: "5 oz bag (~$3)", shelfLifeDays: 5 },
  { id: "tomato", name: "Tomato", category: "vegetable", estimatedUnitCost: 0.60, unit: "tomato", commonPackageSize: "single (~$0.60)", shelfLifeDays: 7 },
  { id: "bell-pepper", name: "Bell pepper", category: "vegetable", estimatedUnitCost: 0.90, unit: "pepper", commonPackageSize: "single (~$0.90)", shelfLifeDays: 7 },
  { id: "broccoli", name: "Broccoli", category: "vegetable", estimatedUnitCost: 1.20, unit: "cup", commonPackageSize: "head (~$2.50)", shelfLifeDays: 7 },
  { id: "scallion", name: "Scallion", category: "vegetable", estimatedUnitCost: 0.15, unit: "stalk", commonPackageSize: "bunch (~$1)", shelfLifeDays: 7 },
  { id: "frozen-veg", name: "Frozen mixed vegetables", category: "frozen", estimatedUnitCost: 0.40, unit: "cup", commonPackageSize: "16 oz bag (~$2)", shelfLifeDays: 180, tags: ["cheap", "staple"] },
  { id: "frozen-corn", name: "Frozen corn", category: "frozen", estimatedUnitCost: 0.35, unit: "cup", commonPackageSize: "16 oz bag (~$2)", shelfLifeDays: 180 },

  // Fruit
  { id: "banana", name: "Banana", category: "fruit", estimatedUnitCost: 0.25, unit: "banana", commonPackageSize: "single (~$0.25)", shelfLifeDays: 5, tags: ["staple", "cheap"] },
  { id: "apple", name: "Apple", category: "fruit", estimatedUnitCost: 0.70, unit: "apple", commonPackageSize: "single (~$0.70)", shelfLifeDays: 14 },
  { id: "lemon", name: "Lemon", category: "fruit", estimatedUnitCost: 0.60, unit: "lemon", commonPackageSize: "single (~$0.60)", shelfLifeDays: 14 },
  { id: "frozen-berries", name: "Frozen berries", category: "frozen", estimatedUnitCost: 0.90, unit: "cup", commonPackageSize: "12 oz bag (~$3.50)", shelfLifeDays: 180 },

  // Dairy
  { id: "cheese", name: "Shredded cheese", category: "dairy", estimatedUnitCost: 0.60, unit: "1/4 cup", commonPackageSize: "8 oz bag (~$3)", shelfLifeDays: 21 },
  { id: "milk", name: "Milk", category: "dairy", estimatedUnitCost: 0.25, unit: "cup", commonPackageSize: "gallon (~$4)", shelfLifeDays: 14 },
  { id: "butter", name: "Butter", category: "dairy", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "1 lb (~$5)", shelfLifeDays: 60 },

  // Canned / pantry
  { id: "tomato-sauce", name: "Tomato sauce", category: "canned", estimatedUnitCost: 1.00, unit: "cup", commonPackageSize: "15 oz can (~$1)", shelfLifeDays: 730, tags: ["staple"] },
  { id: "crushed-tomato", name: "Crushed tomatoes", category: "canned", estimatedUnitCost: 1.50, unit: "can", commonPackageSize: "28 oz can (~$2)", shelfLifeDays: 730 },
  { id: "pesto", name: "Pesto", category: "condiment", estimatedUnitCost: 0.60, unit: "tbsp", commonPackageSize: "6 oz jar (~$4)", shelfLifeDays: 30 },
  { id: "coconut-milk", name: "Coconut milk", category: "canned", estimatedUnitCost: 2.00, unit: "can", commonPackageSize: "13.5 oz can (~$2)", shelfLifeDays: 730 },

  // Condiments
  { id: "soy-sauce", name: "Soy sauce", category: "condiment", estimatedUnitCost: 0.10, unit: "tbsp", commonPackageSize: "10 oz (~$3)", shelfLifeDays: 365, tags: ["staple"] },
  { id: "olive-oil", name: "Olive oil", category: "condiment", estimatedUnitCost: 0.20, unit: "tbsp", commonPackageSize: "17 oz (~$8)", shelfLifeDays: 365, tags: ["staple"] },
  { id: "vegetable-oil", name: "Vegetable oil", category: "condiment", estimatedUnitCost: 0.08, unit: "tbsp", commonPackageSize: "48 oz (~$4)", shelfLifeDays: 365, tags: ["staple"] },
  { id: "honey", name: "Honey", category: "condiment", estimatedUnitCost: 0.30, unit: "tbsp", commonPackageSize: "12 oz (~$5)", shelfLifeDays: 365 },
  { id: "mayonnaise", name: "Mayonnaise", category: "condiment", estimatedUnitCost: 0.10, unit: "tbsp", commonPackageSize: "30 oz (~$4)", shelfLifeDays: 90 },
  { id: "sriracha", name: "Sriracha", category: "condiment", estimatedUnitCost: 0.10, unit: "tsp", commonPackageSize: "17 oz (~$5)", shelfLifeDays: 365 },

  // Spices
  { id: "salt", name: "Salt", category: "spice", estimatedUnitCost: 0.02, unit: "tsp", commonPackageSize: "26 oz (~$1)", shelfLifeDays: 3650, tags: ["staple"] },
  { id: "pepper", name: "Black pepper", category: "spice", estimatedUnitCost: 0.05, unit: "tsp", commonPackageSize: "3 oz (~$3)", shelfLifeDays: 730, tags: ["staple"] },
  { id: "chili-powder", name: "Chili powder", category: "spice", estimatedUnitCost: 0.07, unit: "tsp", commonPackageSize: "3 oz (~$3)", shelfLifeDays: 730 },
  { id: "cumin", name: "Cumin", category: "spice", estimatedUnitCost: 0.07, unit: "tsp", commonPackageSize: "1.5 oz (~$3)", shelfLifeDays: 730 },
  { id: "curry-powder", name: "Curry powder", category: "spice", estimatedUnitCost: 0.08, unit: "tsp", commonPackageSize: "1.6 oz (~$3)", shelfLifeDays: 730 },
  { id: "paprika", name: "Paprika", category: "spice", estimatedUnitCost: 0.06, unit: "tsp", commonPackageSize: "2 oz (~$3)", shelfLifeDays: 730 },
  { id: "italian-seasoning", name: "Italian seasoning", category: "spice", estimatedUnitCost: 0.06, unit: "tsp", commonPackageSize: "1 oz (~$3)", shelfLifeDays: 730 },
  { id: "ginger", name: "Fresh ginger", category: "spice", estimatedUnitCost: 0.10, unit: "tsp", commonPackageSize: "small piece (~$1)", shelfLifeDays: 21 },

  // Snacks / misc
  { id: "salsa", name: "Salsa", category: "condiment", estimatedUnitCost: 0.40, unit: "1/4 cup", commonPackageSize: "16 oz jar (~$3)", shelfLifeDays: 30 },
  { id: "feta", name: "Feta cheese", category: "dairy", estimatedUnitCost: 0.80, unit: "1/4 cup", commonPackageSize: "6 oz (~$4)", shelfLifeDays: 30 },
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
