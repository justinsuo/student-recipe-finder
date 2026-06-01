import type { ExternalRecipe } from "@/lib/externalTypes";

const AREA_CUISINE: Record<string, string> = {
  American: "American", British: "British", Chinese: "Chinese",
  French: "French", Greek: "Greek", Indian: "Indian", Italian: "Italian",
  Japanese: "Japanese", Jamaican: "Jamaican", Malaysian: "Malaysian",
  Mexican: "Mexican", Moroccan: "Moroccan", Polish: "Polish",
  Russian: "Russian", Spanish: "Spanish", Thai: "Thai",
  Turkish: "Turkish", Vietnamese: "Vietnamese", Filipino: "Filipino",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeMealDB(meal: any): ExternalRecipe {
  const ingredients: { name: string; amount: string | null; unit: null }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, amount: measure || null, unit: null });
  }

  const instructions: string[] = (meal.strInstructions as string ?? "")
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 10);

  const tags = meal.strTags ? (meal.strTags as string).split(",").map((t: string) => t.trim().toLowerCase()) : [];

  return {
    id: `themealdb-${meal.idMeal}`,
    source: "themealdb",
    sourceUrl: (meal.strSource as string) || `https://www.themealdb.com/meal/${meal.idMeal}`,
    title: meal.strMeal as string,
    cuisine: AREA_CUISINE[meal.strArea as string] ?? (meal.strArea as string) ?? "International",
    image: (meal.strMealThumb as string) ?? `https://picsum.photos/seed/mdb-${meal.idMeal}/480/320`,
    mealType: (meal.strCategory as string) ?? null,
    totalTimeMinutes: null,
    servings: null,
    difficulty: instructions.length <= 4 ? "Easy" : instructions.length <= 8 ? "Medium" : "Hard",
    rating: null,
    diets: [],
    tags,
    ingredients,
    instructions,
    calories: null, protein: null, carbs: null, fat: null,
    culturalNote: null,
  };
}
