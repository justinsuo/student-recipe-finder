"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Filter, Search, Soup } from "lucide-react";
import { NourishShell } from "@/components/nourish/NourishShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LogRecipeButton } from "@/components/nourish/LogRecipeButton";
import { RECIPES } from "@/data/recipes";
import { bestEffortNutrition, isHighProtein } from "@/lib/nutritionEngine";
import { calculateCostPerServing } from "@/lib/recipeScoring";

type LensSort = "protein" | "kcal-low" | "kcal-high" | "cheap";

const SORTS: { value: LensSort; label: string; description: string }[] = [
  { value: "protein", label: "Highest protein", description: "Most protein per serving first" },
  { value: "kcal-low", label: "Lowest calories", description: "Lean meals" },
  { value: "kcal-high", label: "Highest calories", description: "Big plates / bulk days" },
  { value: "cheap", label: "Cheapest", description: "Lowest cost per serving" },
];

export default function NourishRecipesPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LensSort>("protein");
  const [highProteinOnly, setHighProteinOnly] = useState(false);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = RECIPES.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) {
        return false;
      }
      if (highProteinOnly) {
        const n = bestEffortNutrition(r).estimate;
        if (!isHighProtein(n)) return false;
      }
      return true;
    });
    return list
      .map((r) => {
        const n = bestEffortNutrition(r).estimate;
        const cps = calculateCostPerServing(r);
        return { r, n, cps };
      })
      .sort((a, b) => {
        if (sort === "protein") return b.n.protein - a.n.protein;
        if (sort === "kcal-low") return a.n.calories - b.n.calories;
        if (sort === "kcal-high") return b.n.calories - a.n.calories;
        return a.cps - b.cps;
      })
      .slice(0, 24);
  }, [query, sort, highProteinOnly]);

  return (
    <NourishShell
      title="Recipes through Nourish."
      description="Every database recipe with its calories, macros, and cost — sorted for what you're trying to hit today."
    >
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Filter size={11} /> Lens
            </span>
          }
          title="What are you optimizing for?"
          description="Pick a sort, search the catalog, and log a recipe straight to today's diary."
          tone="violet"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes (chickpeas, tofu, oats…)"
              className="w-full rounded-full border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setHighProteinOnly((v) => !v)}
            aria-pressed={highProteinOnly}
            className={
              highProteinOnly
                ? "inline-flex items-center justify-center gap-1.5 rounded-full border border-violet-600 bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-violet-200 motion-safe:scale-[1.02]"
                : "inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-violet-300 hover:bg-violet-50"
            }
          >
            High protein (≥20g) only
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SORTS.map(({ value, label }) => {
            const active = sort === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSort(value)}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 motion-safe:scale-[1.02]"
                    : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Soup size={11} /> Catalog
            </span>
          }
          title={`Top ${ranked.length} matches`}
          tone="emerald"
        />
        {ranked.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
            No recipes match. Try clearing the search or the high-protein filter.
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map(({ r, n, cps }) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all motion-safe:hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/recipes/${r.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-semibold text-stone-900 hover:text-emerald-700">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {r.totalTimeMinutes} min · ${cps.toFixed(2)}/serving
                    </p>
                  </Link>
                  <Link
                    href={`/recipes/${r.id}`}
                    className="rounded-full bg-stone-100 p-1.5 text-stone-500 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                    aria-label={`Open ${r.name}`}
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">
                    {Math.round(n.calories)} kcal
                  </span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">
                    {Math.round(n.protein)} g protein
                  </span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">
                    {Math.round(n.carbs)} g carbs
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    {Math.round(n.fat)} g fat
                  </span>
                </div>
                <LogRecipeButton recipe={r} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </NourishShell>
  );
}
