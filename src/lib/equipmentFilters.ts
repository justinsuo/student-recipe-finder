import type { Equipment, Recipe } from "@/lib/types";

export type EquipmentProfile =
  | "any"
  | "microwave-only"
  | "air-fryer-only"
  | "microwave-and-air-fryer"
  | "no-stovetop";

export function profileEquipment(profile: EquipmentProfile): Equipment[] {
  switch (profile) {
    case "microwave-only":
      return ["microwave"];
    case "air-fryer-only":
      return ["air-fryer"];
    case "microwave-and-air-fryer":
      return ["microwave", "air-fryer"];
    case "no-stovetop":
      // Everything except stovetop/oven (kept conservative)
      return ["microwave", "air-fryer", "rice-cooker", "no-kitchen"];
    case "any":
    default:
      return [];
  }
}

/**
 * Returns true if the recipe can be cooked using ONLY the allowed equipment.
 * If `allowed` is empty, all recipes pass.
 */
export function recipeFitsEquipment(
  recipe: Recipe,
  allowed: Equipment[],
): boolean {
  if (allowed.length === 0) return true;
  // Every piece of equipment the recipe needs must be in the user's allowed set.
  return recipe.equipment.every((eq) => allowed.includes(eq));
}

export function isAirFryerRecipe(recipe: Recipe): boolean {
  return (
    recipe.primaryCookingMethod === "air-fryer" ||
    recipe.primaryCookingMethod === "air-fryer-and-microwave" ||
    (recipe.equipment.includes("air-fryer") && !recipe.equipment.includes("stovetop"))
  );
}

export function isMicrowaveRecipe(recipe: Recipe): boolean {
  return (
    recipe.primaryCookingMethod === "microwave" ||
    recipe.primaryCookingMethod === "air-fryer-and-microwave" ||
    (recipe.equipment.includes("microwave") && !recipe.equipment.includes("stovetop"))
  );
}

export function isNoStoveRecipe(recipe: Recipe): boolean {
  if (recipe.noStovetopRequired) return true;
  return (
    !recipe.equipment.includes("stovetop") && !recipe.equipment.includes("oven")
  );
}
