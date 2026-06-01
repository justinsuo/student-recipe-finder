"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  Clock,
  SlidersHorizontal,
  X,
  Star,
  ExternalLink,
  Info,
  Sparkles,
} from "lucide-react";
import type { ExploreFilters, ExternalRecipe } from "@/lib/externalTypes";
import { searchExternalRecipes } from "@/lib/services/exploreService";
import { SkeletonRecipeGrid } from "@/components/ui/SkeletonRecipeCard";

// ─── Filter option lists ──────────────────────────────────────────────────────

const CUISINES = [
  "Chinese", "Japanese", "Korean", "Thai", "Vietnamese", "Indian",
  "Italian", "French", "Mexican", "Greek", "Moroccan", "Lebanese",
  "Turkish", "American", "Spanish", "Brazilian", "Jamaican", "Ethiopian",
];

const DIETS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "paleo",
];
const TIMES = [
  { label: "≤15 min", value: 15 },
  { label: "≤30 min", value: 30 },
  { label: "≤60 min", value: 60 },
];

const DEFAULT_FILTERS: ExploreFilters = {
  query: "",
  cuisine: "",
  diet: "",
  maxTime: null,
  sort: "popular",
  page: 1,
};

// ─── Recipe Card ──────────────────────────────────────────────────────────────
//
// Every card always renders the same row order so missing metadata never
// makes one card look broken next to another:
//   1. Image (with seeded picsum fallback)
//   2. Cuisine pill, overlaid bottom-left of image
//   3. Title (always)
//   4. Meta row: time + difficulty (graceful fallbacks)
//   5. Rating row (always — shows "Not rated" if unrated)
//   6. Diet chips (always — shows "—" if none)

function ExploreCard({
  recipe,
  onClick,
}: {
  recipe: ExternalRecipe;
  onClick: () => void;
}) {
  const time = recipe.totalTimeMinutes;
  const difficulty = recipe.difficulty;
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-all duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${recipe.id}/480/320`;
          }}
        />
        {recipe.cuisine && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {recipe.cuisine}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 transition-colors group-hover:text-emerald-700">
          {recipe.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {time ? `${time} min` : "Time varies"}
          </span>
          {difficulty ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                difficulty === "Easy"
                  ? "bg-emerald-100 text-emerald-700"
                  : difficulty === "Medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {difficulty}
            </span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
              Any level
            </span>
          )}
        </div>
        {recipe.rating && (
          <div className="flex items-center gap-1 text-xs">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold text-stone-800">
              {recipe.rating.toFixed(1)}
            </span>
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {recipe.diets.length > 0 ? (
            recipe.diets.slice(0, 2).map((d) => (
              <span
                key={d}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
              >
                {d}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-500">
              Flexible diet
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  recipe,
  onClose,
}: {
  recipe: ExternalRecipe;
  onClose: () => void;
}) {
  const [step, setStep] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="relative aspect-[3/1] overflow-hidden rounded-t-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${recipe.id}/700/250`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-xl font-extrabold leading-tight text-white">
              {recipe.title}
            </h2>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2 text-sm text-stone-600">
            {recipe.cuisine && (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
                {recipe.cuisine}
              </span>
            )}
            {recipe.totalTimeMinutes && (
              <span className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
                <Clock size={12} /> {recipe.totalTimeMinutes} min
              </span>
            )}
            {recipe.servings && (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
                {recipe.servings} servings
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  recipe.difficulty === "Easy"
                    ? "bg-emerald-100 text-emerald-700"
                    : recipe.difficulty === "Medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {recipe.difficulty}
              </span>
            )}
            {recipe.diets.map((d) => (
              <span
                key={d}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
              >
                {d}
              </span>
            ))}
          </div>

          {(recipe.calories || recipe.protein) && (
            <div className="grid grid-cols-4 gap-2">
              {[
                ["Calories", recipe.calories, ""],
                ["Protein", recipe.protein, "g"],
                ["Carbs", recipe.carbs, "g"],
                ["Fat", recipe.fat, "g"],
              ].map(([label, val, unit]) =>
                val != null ? (
                  <div
                    key={String(label)}
                    className={`rounded-2xl p-2.5 text-center ${label === "Calories" ? "bg-amber-50" : "bg-stone-50"}`}
                  >
                    <p className="text-xs text-stone-500">{label}</p>
                    <p className="text-sm font-bold text-stone-900">
                      {Math.round(Number(val))}
                      {unit}
                    </p>
                  </div>
                ) : null,
              )}
            </div>
          )}

          {recipe.ingredients.length > 0 && (
            <div>
              <h3 className="mb-2.5 font-semibold text-stone-800">
                Ingredients
              </h3>
              <ul className="divide-y divide-stone-100">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-3 py-2 text-sm">
                    {ing.amount && (
                      <span className="w-16 shrink-0 font-medium text-emerald-700">
                        {ing.amount} {ing.unit ?? ""}
                      </span>
                    )}
                    <span className="text-stone-800">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipe.instructions.length > 0 ? (
            <div>
              <h3 className="mb-2.5 font-semibold text-stone-800">
                Instructions
              </h3>
              <ol className="space-y-3">
                {recipe.instructions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => setStep(step === i ? null : i)}
                    className={`flex cursor-pointer gap-3 rounded-2xl p-3 transition ${step === i ? "bg-emerald-50" : "hover:bg-stone-50"}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${step === i ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-700"}`}
                    >
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-relaxed text-stone-800">
                      {s}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <Info size={16} className="mt-0.5 shrink-0" />
              <div>
                Full instructions are at the original source.
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-600"
                  >
                    <ExternalLink size={12} /> View recipe
                  </a>
                )}
              </div>
            </div>
          )}

          {recipe.culturalNote && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
              <span className="font-semibold text-stone-800">
                💡 Did you know?{" "}
              </span>
              {recipe.culturalNote}
            </div>
          )}

          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <ExternalLink size={15} /> View original recipe
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);
  const [inputValue, setInputValue] = useState("");
  // We accumulate recipes across "Load more" clicks so the page feels
  // continuous instead of paging back and forth.
  const [recipes, setRecipes] = useState<ExternalRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<ExternalRecipe | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [resultSource, setResultSource] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Demo banner shows only if the live result set actually came back as
  // "mock" (a fallback path). The configured source from env isn't enough
  // because TheMealDB is keyless and is used by default.
  const isDemo = resultSource === "mock";

  const load = useCallback(
    async (f: ExploreFilters, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const result = await searchExternalRecipes(f);
      setRecipes((prev) =>
        append ? [...prev, ...result.recipes] : result.recipes,
      );
      setTotal(result.total);
      setHasMore(result.hasMore);
      setResultSource(result.source);
      if (append) setLoadingMore(false);
      else setLoading(false);
    },
    [],
  );

  // Initial + filter changes — always start from page 1.
  useEffect(() => {
    load({ ...filters, page: 1 }, false);
  }, [
    filters.query,
    filters.cuisine,
    filters.diet,
    filters.maxTime,
    filters.sort,
    load,
  ]);

  function handleQueryChange(v: string) {
    setInputValue(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setFilters((f) => ({ ...f, query: v, page: 1 })),
      400,
    );
  }

  function setFilter(key: keyof ExploreFilters, val: unknown) {
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));
  }

  function clearAllFilters() {
    setFilters(DEFAULT_FILTERS);
    setInputValue("");
  }

  function loadMore() {
    const nextPage = filters.page + 1;
    setFilters((f) => ({ ...f, page: nextPage }));
    load({ ...filters, page: nextPage }, true);
  }

  // ── Active filter chips ──
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.query.trim())
    activeChips.push({
      key: "q",
      label: `"${filters.query.trim()}"`,
      clear: () => {
        setInputValue("");
        setFilters((f) => ({ ...f, query: "", page: 1 }));
      },
    });
  if (filters.cuisine)
    activeChips.push({
      key: "cuisine",
      label: filters.cuisine,
      clear: () => setFilter("cuisine", ""),
    });
  if (filters.diet)
    activeChips.push({
      key: "diet",
      label: filters.diet,
      clear: () => setFilter("diet", ""),
    });
  if (filters.maxTime)
    activeChips.push({
      key: "time",
      label: `≤${filters.maxTime} min`,
      clear: () => setFilter("maxTime", null),
    });
  if (filters.sort !== DEFAULT_FILTERS.sort) {
    const lbl: Record<ExploreFilters["sort"], string> = {
      popular: "Most popular",
      rating: "Highest rated",
      fastest: "Fastest",
    };
    activeChips.push({
      key: "sort",
      label: `Sort: ${lbl[filters.sort]}`,
      clear: () => setFilter("sort", DEFAULT_FILTERS.sort),
    });
  }

  const visibleCount = recipes.length;
  const showingCopy = loading
    ? "Searching…"
    : total === 0
      ? "No recipes match"
      : !hasMore && visibleCount === total
        ? `Showing all ${total.toLocaleString()} recipes`
        : `Showing ${visibleCount.toLocaleString()} of ${total.toLocaleString()} recipes`;

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-1 flex items-center gap-2">
          <Globe size={18} className="text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">World Recipes</p>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
          Explore Global Cuisine
        </h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Discover authentic recipes from cuisines around the world — search,
          filter by cuisine, diet, or cooking time.
        </p>
      </header>

      {isDemo && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">Demo mode</span> — showing a small
            sample library. Live recipe search will load many more once a
            recipe API is connected.
          </p>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={inputValue}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search any cuisine, dish, or ingredient…"
            className="w-full rounded-full border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </div>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition ${filtersOpen ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {/* Expanded filters */}
      {filtersOpen && (
        <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Cuisine
              </p>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {CUISINES.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      setFilter("cuisine", filters.cuisine === c ? "" : c)
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${filters.cuisine === c ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Diet
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setFilter("diet", filters.diet === d ? "" : d)
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${filters.diet === d ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Max Time
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TIMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() =>
                      setFilter(
                        "maxTime",
                        filters.maxTime === t.value ? null : t.value,
                      )
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${filters.maxTime === t.value ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Sort
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["popular", "Most popular"],
                    ["rating", "Highest rated"],
                    ["fastest", "Fastest"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setFilter("sort", v)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${filters.sort === v ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-xs text-stone-500 transition hover:text-stone-700"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Active filters
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <X size={11} aria-hidden />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs font-semibold text-stone-600 transition hover:text-emerald-700 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results header — count */}
      <p className="text-sm text-stone-600">{showingCopy}</p>

      {/* Grid + states */}
      {loading ? (
        <SkeletonRecipeGrid count={8} />
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-200 bg-white px-6 py-14 text-center">
          <span className="mb-4 text-5xl">🍽️</span>
          <h3 className="mb-1 text-lg font-semibold text-stone-800">
            No recipes match your filters
          </h3>
          <p className="max-w-md text-sm text-stone-500">
            Try clearing filters, or have AI Chef invent a custom recipe for
            what you have.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={clearAllFilters}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Clear filters
            </button>
            <Link
              href="/ai-chef"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              <Sparkles size={14} /> Ask AI Chef
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {recipes.map((recipe) => (
            <ExploreCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelected(recipe)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && recipes.length > 0 && hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more recipes"}
          </button>
        </div>
      )}
      {!loading && recipes.length > 0 && !hasMore && (
        <p className="pt-2 text-center text-xs text-stone-400">
          You&apos;ve reached the end.
        </p>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel recipe={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
