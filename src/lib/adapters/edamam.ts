import type { ExternalRecipe } from "@/lib/externalTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeEdamam(hit: any): ExternalRecipe {
  const r = hit.recipe;
  const uri: string = r.uri ?? "";
  const rawId = uri.split("#recipe_")[1] ?? uri.replace(/\W/g, "").slice(0, 20);

  const getNutrient = (key: string): number | null =>
    r.totalNutrients?.[key]?.quantity != null
      ? Math.round(r.totalNutrients[key].quantity / (r.yield || 1))
      : null;

  const totalTime: number | null = r.totalTime > 0 ? r.totalTime : null;
  const difficulty = totalTime == null ? null
    : totalTime <= 20 ? "Easy" as const
    : totalTime <= 50 ? "Medium" as const
    : "Hard" as const;

  return {
    id: `edamam-${rawId}`,
    source: "edamam",
    sourceUrl: r.url as string,
    title: r.label as string,
    cuisine: (r.cuisineType?.[0] as string) ?? "International",
    image: (r.image as string) ?? `https://picsum.photos/seed/ed-${rawId}/480/320`,
    mealType: (r.mealType?.[0] as string) ?? null,
    totalTimeMinutes: totalTime,
    servings: Math.round(r.yield as number) || null,
    difficulty,
    rating: null,
    diets: (r.dietLabels as string[]) ?? [],
    tags: [...(r.dietLabels ?? []), ...(r.dishType ?? [])],
    ingredients: ((r.ingredientLines as string[]) ?? []).map((line: string) => ({
      name: line,
      amount: null,
      unit: null,
    })),
    instructions: [],
    calories: r.calories ? Math.round((r.calories as number) / (r.yield || 1)) : null,
    protein: getNutrient("PROCNT"),
    carbs: getNutrient("CHOCDF"),
    fat: getNutrient("FAT"),
    culturalNote: null,
  };
}
