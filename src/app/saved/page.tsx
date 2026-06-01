"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useAppStore } from "@/lib/AppStore";
import { RECIPE_MAP } from "@/data/recipes";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";

export default function SavedPage() {
  const { saved, hydrated } = useAppStore();
  const recipes = saved
    .map((id) => RECIPE_MAP.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <div className="space-y-8">
      <header>
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Bookmark size={14} /> Saved Recipes
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
          Your collection
        </h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Tap the bookmark icon on any recipe to save it here. Your saved
          recipes persist on this device.
        </p>
      </header>

      {hydrated && recipes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <div className="mb-3 text-5xl" aria-hidden>
            🔖
          </div>
          <h3 className="text-lg font-semibold text-stone-900">
            No saved recipes yet
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Browse recipes and tap the bookmark icon to save them.
          </p>
          <div className="mt-5">
            <Link
              href="/cheap-recipes"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Find recipes
            </Link>
          </div>
        </div>
      ) : (
        <RecipeGrid recipes={recipes} />
      )}
    </div>
  );
}
