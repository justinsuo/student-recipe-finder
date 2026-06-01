"use client";

import { useMemo, useState } from "react";
import { Coins, Filter, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { rankCheapRecipes } from "@/lib/recipeScoring";
import type {
  CheapFilters,
  DietTag,
  Equipment,
  MealType,
  TimeBucket,
} from "@/lib/types";

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
  { value: "microwave", label: "Microwave", emoji: "📡" },
  { value: "stovetop", label: "Stovetop", emoji: "🍳" },
  { value: "oven", label: "Oven", emoji: "🔥" },
  { value: "rice-cooker", label: "Rice cooker", emoji: "🍚" },
  { value: "air-fryer", label: "Air fryer", emoji: "💨" },
  { value: "no-kitchen", label: "Dorm only", emoji: "🏠" },
];

const DIET_OPTIONS: { value: DietTag; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "high-protein", label: "High protein" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
];

const TIME_OPTIONS: { value: TimeBucket | "any"; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "under-10", label: "Under 10 min" },
  { value: "under-20", label: "Under 20 min" },
  { value: "under-30", label: "Under 30 min" },
  { value: "meal-prep", label: "Meal prep" },
];

const MEAL_OPTIONS: { value: MealType | "any"; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "meal-prep", label: "Meal prep" },
];

const DEFAULTS: CheapFilters = {
  budgetPerServing: 3,
  servings: 2,
  equipment: ["stovetop", "microwave"],
  diet: [],
  time: "any",
  mealType: "any",
};

type Sort = "cheapest" | "fastest" | "protein" | "best";

export default function CheapRecipesPage() {
  const [filters, setFilters] = useState<CheapFilters>(DEFAULTS);
  const [sort, setSort] = useState<Sort>("best");

  const results = useMemo(() => {
    const r = rankCheapRecipes(filters);
    const sorted = [...r];
    if (sort === "cheapest") sorted.sort((a, b) => a.costPerServing - b.costPerServing);
    else if (sort === "fastest")
      sorted.sort((a, b) => a.recipe.totalTimeMinutes - b.recipe.totalTimeMinutes);
    else if (sort === "protein")
      sorted.sort(
        (a, b) => b.recipe.estimatedNutrition.protein - a.recipe.estimatedNutrition.protein,
      );
    return sorted;
  }, [filters, sort]);

  function toggleEquipment(eq: Equipment) {
    setFilters((f) =>
      f.equipment.includes(eq)
        ? { ...f, equipment: f.equipment.filter((e) => e !== eq) }
        : { ...f, equipment: [...f.equipment, eq] },
    );
  }

  function toggleDiet(d: DietTag) {
    setFilters((f) =>
      f.diet.includes(d)
        ? { ...f, diet: f.diet.filter((x) => x !== d) }
        : { ...f, diet: [...f.diet, d] },
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-700">Cheap Recipe Coach</p>
          <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
            Find your cheapest dinner
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stone-600">
            Tell us what you can spend, what you&apos;ve got to cook with, and how you eat.
            We&apos;ll rank recipes by cost, time, and practicality.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCcw size={14} />}
          onClick={() => {
            setFilters(DEFAULTS);
            setSort("best");
          }}
        >
          Reset
        </Button>
      </header>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2 text-stone-700">
          <Filter size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Filters</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-stone-800">
                Budget per serving
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <Coins size={12} /> ${filters.budgetPerServing.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min={0.5}
                max={6}
                step={0.25}
                value={filters.budgetPerServing}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    budgetPerServing: parseFloat(e.target.value),
                  }))
                }
                className="mt-2 w-full accent-emerald-600"
                aria-label="Budget per serving"
              />
              <div className="mt-1 flex justify-between text-[11px] text-stone-500">
                <span>$0.50</span>
                <span>$6.00</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-stone-800">
                Servings
                <span className="text-xs text-stone-600">{filters.servings}</span>
              </label>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={filters.servings}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    servings: parseInt(e.target.value, 10),
                  }))
                }
                className="mt-2 w-full accent-emerald-600"
                aria-label="Servings"
              />
            </div>

            <FilterGroup label="Time">
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={filters.time === opt.value}
                    onClick={() => setFilters((f) => ({ ...f, time: opt.value }))}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Meal type">
              <div className="flex flex-wrap gap-2">
                {MEAL_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={filters.mealType === opt.value}
                    onClick={() =>
                      setFilters((f) => ({ ...f, mealType: opt.value }))
                    }
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </FilterGroup>
          </div>

          <div className="space-y-4">
            <FilterGroup label="Equipment">
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={filters.equipment.includes(opt.value)}
                    onClick={() => toggleEquipment(opt.value)}
                  >
                    <span aria-hidden>{opt.emoji}</span> {opt.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Pick all that apply. We&apos;ll show recipes you can actually cook.
              </p>
            </FilterGroup>

            <FilterGroup label="Dietary preference">
              <div className="flex flex-wrap gap-2">
                {DIET_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={filters.diet.includes(opt.value)}
                    onClick={() => toggleDiet(opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Sort by">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["best", "Best overall"],
                    ["cheapest", "Cheapest per serving"],
                    ["fastest", "Fastest"],
                    ["protein", "Highest protein"],
                  ] as [Sort, string][]
                ).map(([value, label]) => (
                  <Chip
                    key={value}
                    active={sort === value}
                    onClick={() => setSort(value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </FilterGroup>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{results.length}</span>{" "}
            recipes match
          </p>
        </div>
        <RecipeGrid
          results={results}
          emptyTitle="No recipes match these filters"
          emptyDescription="Try raising your budget, allowing more equipment, or removing a diet restriction."
          emptyAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(DEFAULTS)}
            >
              Reset filters
            </Button>
          }
        />
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-stone-800">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
      }
    >
      {children}
    </button>
  );
}
