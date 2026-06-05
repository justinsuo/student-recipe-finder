import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECIPE_MAP, RECIPES } from "@/data/recipes";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";

export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = RECIPE_MAP.get(id);
  if (!recipe) return {};
  const desc = `${recipe.name}: ${recipe.description?.slice(0, 140) ?? ""}`.trim();
  return {
    title: `${recipe.name} — Waivy`,
    description: desc,
    openGraph: {
      title: `${recipe.name} — Waivy`,
      description: desc,
      type: "article",
    },
  };
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
