"use client";

import { useMemo, useState } from "react";
import {
  Refrigerator,
  Plus,
  X,
  Search,
  Clock4,
  Sparkles,
} from "lucide-react";
import {
  INGREDIENTS,
  INGREDIENT_MAP,
  CATEGORY_LABEL,
  QUICK_ADD_STAPLES,
} from "@/data/ingredients";
import { useAppStore } from "@/lib/AppStore";
import {
  groupPantryResults,
  rankPantryRecipes,
  recommendSmartBuys,
} from "@/lib/recipeScoring";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Ingredient, IngredientCategory } from "@/lib/types";

export default function PantryPage() {
  const {
    pantry,
    addPantryItem,
    removePantryItem,
    togglePantryUseSoon,
    clearPantry,
    addStapleToGrocery,
  } = useAppStore();

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return [] as Ingredient[];
    const lower = search.toLowerCase();
    return INGREDIENTS.filter(
      (i) =>
        i.name.toLowerCase().includes(lower) &&
        !pantry.some((p) => p.ingredientId === i.id),
    ).slice(0, 8);
  }, [search, pantry]);

  const grouped = useMemo(() => {
    const map = new Map<IngredientCategory, Ingredient[]>();
    for (const item of pantry) {
      const ing = INGREDIENT_MAP.get(item.ingredientId);
      if (!ing) continue;
      const list = map.get(ing.category) ?? [];
      list.push(ing);
      map.set(ing.category, list);
    }
    return map;
  }, [pantry]);

  const ranked = useMemo(() => rankPantryRecipes(pantry), [pantry]);
  const groups = useMemo(() => groupPantryResults(ranked, pantry), [ranked, pantry]);
  const smartBuys = useMemo(() => recommendSmartBuys(pantry), [pantry]);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-medium text-emerald-700">Pantry-to-Plate</p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
          What can you make right now?
        </h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Add what&apos;s in your kitchen. We&apos;ll surface recipes you can
          make, ones you can make with 1–2 cheap items, and meals to use up
          anything expiring.
        </p>
      </header>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
            <Refrigerator size={16} /> Your pantry ({pantry.length})
          </h2>
          {pantry.length > 0 && (
            <button
              onClick={clearPantry}
              className="text-xs font-medium text-stone-500 hover:text-red-600"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="relative mt-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search to add ingredients (rice, eggs, tofu…)"
            className="w-full rounded-full border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            aria-label="Search ingredients"
          />
          {filtered.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-lg">
              {filtered.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => {
                    addPantryItem({ ingredientId: ing.id });
                    setSearch("");
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-emerald-50"
                >
                  <span className="font-medium text-stone-800">{ing.name}</span>
                  <span className="text-xs text-stone-500">
                    {CATEGORY_LABEL[ing.category]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Quick add staples
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_ADD_STAPLES.map((id) => {
              const ing = INGREDIENT_MAP.get(id);
              if (!ing) return null;
              const alreadyAdded = pantry.some((p) => p.ingredientId === id);
              return (
                <button
                  key={id}
                  disabled={alreadyAdded}
                  onClick={() => addPantryItem({ ingredientId: id })}
                  className={
                    alreadyAdded
                      ? "rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700"
                      : "inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }
                >
                  {!alreadyAdded && <Plus size={12} />}
                  {ing.name}
                </button>
              );
            })}
          </div>
        </div>

        {pantry.length > 0 ? (
          <div className="mt-6 space-y-4">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {CATEGORY_LABEL[category]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((ing) => {
                    const item = pantry.find((p) => p.ingredientId === ing.id);
                    const useSoon = item?.useSoon ?? false;
                    return (
                      <span
                        key={ing.id}
                        className={
                          useSoon
                            ? "group flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
                            : "group flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-800"
                        }
                      >
                        {useSoon && <Clock4 size={11} />}
                        {ing.name}
                        <button
                          onClick={() => togglePantryUseSoon(ing.id)}
                          title={useSoon ? "Unmark" : "Mark as use-soon"}
                          className="ml-0.5 text-stone-500 hover:text-amber-700"
                          aria-label="Toggle use soon"
                        >
                          <Clock4 size={11} />
                        </button>
                        <button
                          onClick={() => removePantryItem(ing.id)}
                          className="ml-0.5 text-stone-500 hover:text-red-600"
                          aria-label={`Remove ${ing.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-center text-sm text-stone-600">
            Start by tapping a few quick-add staples above ↑
          </div>
        )}
      </section>

      {pantry.length === 0 ? (
        <EmptyState
          emoji="🥕"
          title="Your pantry is empty"
          description="Add a few ingredients above and we'll start suggesting meals you can make right now."
        />
      ) : (
        <div className="space-y-10">
          {smartBuys.length > 0 && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-800">
                <Sparkles size={16} /> Smart buys
              </h2>
              <p className="mt-1 text-sm text-amber-900">
                Adding one of these to your pantry would unlock more recipes.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {smartBuys.map((sb) => {
                  const ing = INGREDIENT_MAP.get(sb.ingredientId);
                  if (!ing) return null;
                  return (
                    <div
                      key={sb.ingredientId}
                      className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          {ing.name}
                        </p>
                        <p className="text-xs text-stone-600">
                          Unlocks {sb.unlocks} {sb.unlocks === 1 ? "recipe" : "recipes"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addStapleToGrocery(sb.ingredientId)}
                      >
                        Add to list
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {groups.useSoon.length > 0 && (
            <RecipeGroup
              title="Use-soon recipes"
              description="These use ingredients you've marked as expiring."
              recipes={groups.useSoon}
              tone="amber"
            />
          )}

          <RecipeGroup
            title="Can make now"
            description="All ingredients on hand."
            recipes={groups.canMakeNow}
            tone="green"
          />

          <RecipeGroup
            title="Need 1–2 cheap items"
            description="You're so close — just a couple of low-cost items needed."
            recipes={groups.needFewItems}
            tone="emerald"
          />

          <RecipeGroup
            title="Best value if you buy one thing"
            description="A single addition would unlock these meals."
            recipes={groups.buyOneUnlock}
            tone="sky"
          />
        </div>
      )}
    </div>
  );
}

function RecipeGroup({
  title,
  description,
  recipes,
  tone,
}: {
  title: string;
  description: string;
  recipes: ReturnType<typeof rankPantryRecipes>;
  tone: "green" | "emerald" | "amber" | "sky";
}) {
  if (recipes.length === 0) return null;
  const dots: Record<string, string> = {
    green: "bg-green-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
  };
  return (
    <section>
      <header className="mb-4 flex items-start gap-3">
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dots[tone]}`} />
        <div>
          <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
          <p className="text-sm text-stone-600">{description}</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.slice(0, 6).map((r) => (
          <RecipeCard key={r.recipe.id} result={r} />
        ))}
      </div>
    </section>
  );
}
