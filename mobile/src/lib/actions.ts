/** Cross-screen recipe actions: log a recipe to Nourish as a meal. */
import { logFood } from "./stores/nourish";
import type { FoodItem, MealSlot } from "@/lib/nourish/types";
import type { NutritionEstimate } from "@/lib/types";

export function mealSlotNow(): MealSlot {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function logRecipeAsMeal(name: string, n: NutritionEstimate, externalId?: string): number {
  const food: FoodItem = {
    id: `recipe-${Date.now().toString(36)}-${Math.floor((n.calories || 0))}`,
    source: "recipe",
    externalId,
    name,
    servingDescription: "1 serving",
    kcal: Math.round(n.calories || 0),
    proteinG: Math.round((n.protein || 0) * 10) / 10,
    carbG: Math.round((n.carbs || 0) * 10) / 10,
    fatG: Math.round((n.fat || 0) * 10) / 10,
    fiberG: n.fiber,
  };
  logFood(food, mealSlotNow(), 1);
  return food.kcal;
}
