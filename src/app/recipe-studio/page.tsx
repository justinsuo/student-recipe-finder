"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wand2,
  ChefHat,
  Sparkles,
  ArrowRight,
  Trash2,
} from "lucide-react";
import {
  deleteCustomRecipe,
  getCustomRecipes,
  getStoredRecipeImage,
  imageDataUrl,
} from "@/lib/customRecipeStorage";
import type { CustomRecipe } from "@/lib/customRecipeTypes";

export default function RecipeStudioPage() {
  const [recipes, setRecipes] = useState<CustomRecipe[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecipes(getCustomRecipes());
  }, []);

  function remove(id: string) {
    const target = recipes.find((r) => r.id === id);
    const name = target?.name ?? "this recipe";
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    deleteCustomRecipe(id);
    setRecipes(getCustomRecipes());
  }

  const aiOnes = recipes.filter((r) => r.isAIGenerated);
  const userOnes = recipes.filter((r) => !r.isAIGenerated);

  return (
    <div className="space-y-10">
      <header>
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Wand2 size={14} /> Recipe Studio
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
          Make your own recipes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Generate with AI or build a recipe card from scratch. Both end up in
          your saved collection.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/ai-chef"
          className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <Sparkles size={22} />
          </div>
          <h2 className="text-xl font-semibold text-stone-900">
            Let AI make a recipe
          </h2>
          <p className="text-sm text-stone-600">
            AI Chef generates an original recipe from your ingredients, budget,
            and equipment — with an AI image attached.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:underline">
            Generate with AI Chef <ArrowRight size={14} />
          </span>
        </Link>
        <Link
          href="/recipe-studio/new"
          className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ChefHat size={22} />
          </div>
          <h2 className="text-xl font-semibold text-stone-900">
            Create my own recipe card
          </h2>
          <p className="text-sm text-stone-600">
            Build a recipe by hand. We&apos;ll auto-generate an image for it by
            default.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:underline">
            Build my recipe card <ArrowRight size={14} />
          </span>
        </Link>
      </section>

      <Section title="AI-generated recipes" recipes={aiOnes} onRemove={remove} />
      <Section title="Created by you" recipes={userOnes} onRemove={remove} />
    </div>
  );
}

function Section({
  title,
  recipes,
  onRemove,
}: {
  title: string;
  recipes: CustomRecipe[];
  onRemove: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-stone-900">{title}</h2>
      {recipes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-8 text-center text-sm text-stone-600">
          Nothing here yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeMiniCard key={r.id} recipe={r} onRemove={onRemove} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecipeMiniCard({
  recipe,
  onRemove,
}: {
  recipe: CustomRecipe;
  onRemove: (id: string) => void;
}) {
  const stored = getStoredRecipeImage(recipe.id);
  const src = recipe.image?.src ?? (stored?.b64 ? imageDataUrl(stored.b64) : null);
  return (
    <div className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <Link
        href={`/recipes/custom?id=${recipe.id}`}
        className="relative block aspect-[4/3] bg-stone-100"
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={recipe.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-50 text-stone-500">
            <ChefHat size={36} />
          </div>
        )}
        <div className="absolute left-3 top-3">
          {recipe.isAIGenerated ? (
            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              AI
            </span>
          ) : (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              Yours
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-1 p-3">
        <Link
          href={`/recipes/custom?id=${recipe.id}`}
          className="block text-sm font-semibold text-stone-900 hover:text-emerald-700"
        >
          {recipe.name}
        </Link>
        <p className="text-xs text-stone-500">
          ${Number.isFinite(Number(recipe.estimatedCostPerServing)) ? Number(recipe.estimatedCostPerServing).toFixed(2) : "—"}/serving ·{" "}
          {recipe.totalTimeMinutes} min
        </p>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onRemove(recipe.id)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            aria-label={`Delete ${recipe.name}`}
            title="Delete this recipe — can't be undone"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
