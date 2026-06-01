"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ChefHat, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/AppStore";
import { RECIPE_MAP } from "@/data/recipes";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import {
  getCustomRecipes,
  getStoredRecipeImage,
  imageDataUrl,
} from "@/lib/customRecipeStorage";
import type { CustomRecipe } from "@/lib/customRecipeTypes";

export default function SavedPage() {
  const { saved, hydrated } = useAppStore();
  const [filter, setFilter] = useState<"all" | "database" | "ai" | "user">("all");
  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomRecipes(getCustomRecipes());
  }, [saved]);

  const databaseSaved = saved
    .map((id) => RECIPE_MAP.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r);
  const savedCustomIds = new Set(saved);
  const customSaved = customRecipes.filter((r) => savedCustomIds.has(r.id));

  const showDatabase = filter === "all" || filter === "database";
  const showAi = filter === "all" || filter === "ai";
  const showUser = filter === "all" || filter === "user";

  const dbCount = databaseSaved.length;
  const aiCount = customSaved.filter((r) => r.isAIGenerated).length;
  const userCount = customSaved.filter((r) => !r.isAIGenerated).length;
  const totalCount = dbCount + aiCount + userCount;

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
          Database recipes you bookmarked, plus your AI-generated and custom
          recipes.
        </p>
      </header>

      {hydrated && totalCount === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <div className="mb-3 text-5xl" aria-hidden>
            🔖
          </div>
          <h3 className="text-lg font-semibold text-stone-900">
            No saved recipes yet
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Browse recipes and tap the bookmark icon, or build one with AI
            Chef.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/cheap-recipes"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Find recipes
            </Link>
            <Link
              href="/ai-chef"
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              Try AI Chef
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All ({totalCount})
            </FilterChip>
            <FilterChip
              active={filter === "database"}
              onClick={() => setFilter("database")}
            >
              Database ({dbCount})
            </FilterChip>
            <FilterChip
              active={filter === "ai"}
              onClick={() => setFilter("ai")}
            >
              <Sparkles size={11} className="mr-1" /> AI Generated ({aiCount})
            </FilterChip>
            <FilterChip
              active={filter === "user"}
              onClick={() => setFilter("user")}
            >
              Created by you ({userCount})
            </FilterChip>
          </div>

          {showDatabase && databaseSaved.length > 0 && (
            <RecipeGrid recipes={databaseSaved} />
          )}

          {showAi && (
            <CustomSection
              recipes={customSaved.filter((r) => r.isAIGenerated)}
              title="AI Generated"
            />
          )}

          {showUser && (
            <CustomSection
              recipes={customSaved.filter((r) => !r.isAIGenerated)}
              title="Created by you"
            />
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
          : "inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
      }
    >
      {children}
    </button>
  );
}

function CustomSection({
  recipes,
  title,
}: {
  recipes: CustomRecipe[];
  title: string;
}) {
  if (recipes.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-stone-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <CustomCard key={r.id} recipe={r} />
        ))}
      </div>
    </section>
  );
}

function CustomCard({ recipe }: { recipe: CustomRecipe }) {
  const stored = getStoredRecipeImage(recipe.id);
  const src = recipe.image?.src ?? (stored?.b64 ? imageDataUrl(stored.b64) : null);
  return (
    <Link
      href={`/recipes/custom?id=${recipe.id}`}
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-stone-100">
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
      </div>
      <div className="space-y-1 p-3">
        <p className="text-sm font-semibold text-stone-900 group-hover:text-emerald-700">
          {recipe.name}
        </p>
        <p className="text-xs text-stone-500">
          ${Number.isFinite(Number(recipe.estimatedCostPerServing)) ? Number(recipe.estimatedCostPerServing).toFixed(2) : "—"}/serving ·{" "}
          {recipe.totalTimeMinutes} min
        </p>
      </div>
    </Link>
  );
}
