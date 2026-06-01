import { notFound } from "next/navigation";
import { RECIPE_MAP, RECIPES } from "@/data/recipes";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";

export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = RECIPE_MAP.get(id);
  if (!recipe) notFound();
  return <RecipeDetailClient recipe={recipe} />;
}
