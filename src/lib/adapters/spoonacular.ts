import type { ExternalRecipe } from "@/lib/externalTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpoonacular(raw: any): ExternalRecipe {
  const cuisines: string[] = raw.cuisines ?? [];
  const dishTypes: string[] = raw.dishTypes ?? [];
  const diets: string[] = raw.diets ?? [];
  const score: number = raw.spoonacularScore ?? 0;

  const instructions: string[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw.analyzedInstructions?.flatMap((b: any) => b.steps.map((s: any) => s.step as string)) ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ingredients = (raw.extendedIngredients ?? []).map((i: any) => ({
    name: i.name as string,
    amount: i.amount != null ? String(i.amount) : null,
    unit: (i.unit as string) || null,
  }));

  const getNutrient = (name: string): number | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = raw.nutrition?.nutrients?.find((x: any) => x.name.toLowerCase() === name.toLowerCase());
    return n?.amount ?? null;
  };

  const difficulty = (() => {
    const t = raw.readyInMinutes as number | undefined;
    if (!t) return null;
    if (t <= 20) return "Easy" as const;
    if (t <= 45) return "Medium" as const;
    return "Hard" as const;
  })();

  return {
    id: `spoonacular-${raw.id}`,
    source: "spoonacular",
    sourceUrl: raw.sourceUrl ?? `https://spoonacular.com/recipes/${raw.id}`,
    title: raw.title as string,
    cuisine: cuisines[0] ?? "International",
    image: (raw.image as string) ?? `https://picsum.photos/seed/sp-${raw.id}/480/320`,
    mealType: dishTypes[0] ?? null,
    totalTimeMinutes: (raw.readyInMinutes as number) ?? null,
    servings: (raw.servings as number) ?? null,
    difficulty,
    rating: score > 0 ? Math.round((score / 20) * 10) / 10 : null,
    diets,
    tags: dishTypes,
    ingredients,
    instructions,
    calories: getNutrient("Calories"),
    protein: getNutrient("Protein"),
    carbs: getNutrient("Carbohydrates"),
    fat: getNutrient("Fat"),
    culturalNote: null,
  };
}
