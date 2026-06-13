import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECIPE_MAP, ALL_RECIPES } from "@/data/recipes";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";

export function generateStaticParams() {
  return ALL_RECIPES.map((r) => ({ id: r.id }));
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
  const variantSiblings = recipe.variantGroup
    ? ALL_RECIPES.filter((r) => r.variantGroup === recipe.variantGroup)
    : [];
  return <RecipeDetailClient recipe={recipe} variantSiblings={variantSiblings} />;
}
