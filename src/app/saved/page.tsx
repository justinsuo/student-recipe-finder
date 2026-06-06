"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/AppStore";
import { RECIPE_MAP } from "@/data/recipes";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import {
  getCustomRecipes,
  getStoredRecipeImage,
  imageDataUrl,
} from "@/lib/customRecipeStorage";
import type { CustomRecipe } from "@/lib/customRecipeTypes";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

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
      <PageHeader
        eyebrow="Saved Recipes"
        title="Your recipe box."
        description="Database recipes you bookmarked, plus your AI-generated and custom recipes."
        tone="rose"
      />

      {hydrated && totalCount === 0 ? (
        <EmptyState
          emoji="🔖"
          title="Your recipe box is empty"
          description="Save recipes you want to cook later, or have AI Chef invent one from what you have."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/cheap-recipes"
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Find cheap recipes
              </Link>
              <Link
                href="/ai-chef"
                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                Ask AI Chef
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="sticky top-16 z-20 -mx-2 px-2 py-1">
            <div className="rounded-2xl border border-stone-200 bg-white/85 p-2.5 shadow-sm backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  <AnimatedNumber value={totalCount} duration={520} /> total
                </span>
              </div>
            </div>
          </div>

          {showDatabase && databaseSaved.length > 0 && (
            <ScrollReveal as="section">
              <SectionHeading
                eyebrow={`${dbCount} ${dbCount === 1 ? "recipe" : "recipes"}`}
                title="From the database"
                tone="emerald"
              />
              <div className="mt-5">
                <RecipeGrid recipes={databaseSaved} from="saved" />
              </div>
            </ScrollReveal>
          )}

          {showAi && (
            <CustomSection
              recipes={customSaved.filter((r) => r.isAIGenerated)}
              title="AI Generated"
              tone="violet"
            />
          )}

          {showUser && (
            <CustomSection
              recipes={customSaved.filter((r) => !r.isAIGenerated)}
              title="Created by you"
              tone="sky"
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
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center rounded-full border border-emerald-600 bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 transition-all motion-safe:scale-[1.02]"
          : "inline-flex items-center rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50"
      }
    >
      {children}
    </button>
  );
}

function CustomSection({
  recipes,
  title,
  tone = "indigo",
}: {
  recipes: CustomRecipe[];
  title: string;
  tone?: "emerald" | "violet" | "sky" | "indigo";
}) {
  if (recipes.length === 0) return null;
  return (
    <ScrollReveal as="section">
      <SectionHeading
        eyebrow={`${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`}
        title={title}
        tone={tone}
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <CustomCard key={r.id} recipe={r} />
        ))}
      </div>
    </ScrollReveal>
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
