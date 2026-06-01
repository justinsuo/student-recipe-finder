"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Globe, Clock, SlidersHorizontal, X, Star, ExternalLink, Info, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ExploreFilters, ExternalRecipe } from "@/lib/externalTypes";
import { searchExternalRecipes, getExploreSource } from "@/lib/services/exploreService";

// ─── Filters ──────────────────────────────────────────────────────────────────

const CUISINES = [
  "Chinese", "Japanese", "Korean", "Thai", "Vietnamese", "Indian",
  "Italian", "French", "Mexican", "Greek", "Moroccan", "Lebanese",
  "Turkish", "American", "Spanish", "Brazilian", "Jamaican", "Ethiopian",
];

const DIETS = ["vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "paleo"];
const TIMES = [{ label: "≤15 min", value: 15 }, { label: "≤30 min", value: 30 }, { label: "≤60 min", value: 60 }];

const DEFAULT_FILTERS: ExploreFilters = { query: "", cuisine: "", diet: "", maxTime: null, sort: "popular", page: 1 };

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    spoonacular: "bg-green-600", edamam: "bg-blue-600",
    themealdb: "bg-orange-500", mock: "bg-stone-500",
  };
  const labels: Record<string, string> = {
    spoonacular: "Spoonacular", edamam: "Edamam", themealdb: "MealDB", mock: "Demo",
  };
  return (
    <span className={`${colors[source] ?? "bg-stone-500"} rounded-full px-2 py-0.5 text-[10px] font-semibold text-white tracking-wide`}>
      {labels[source] ?? source}
    </span>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function ExploreCard({ recipe, onClick }: { recipe: ExternalRecipe; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${recipe.id}/480/320`; }}
        />
        <div className="absolute top-2 left-2"><SourceBadge source={recipe.source} /></div>
        {recipe.cuisine && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {recipe.cuisine}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 font-semibold text-sm leading-snug text-stone-900 group-hover:text-emerald-700 transition-colors">
          {recipe.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          {recipe.totalTimeMinutes && (
            <span className="flex items-center gap-1"><Clock size={11} />{recipe.totalTimeMinutes} min</span>
          )}
          {recipe.difficulty && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              recipe.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700"
              : recipe.difficulty === "Medium" ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
            }`}>{recipe.difficulty}</span>
          )}
        </div>
        {recipe.rating && (
          <div className="flex items-center gap-1 text-xs">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold text-stone-800">{recipe.rating.toFixed(1)}</span>
          </div>
        )}
        {recipe.diets.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {recipe.diets.slice(0, 2).map((d) => (
              <span key={d} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{d}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ recipe, onClose }: { recipe: ExternalRecipe; onClose: () => void }) {
  const [step, setStep] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        {/* Hero */}
        <div className="relative aspect-[3/1] overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${recipe.id}/700/250`; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <SourceBadge source={recipe.source} />
            <h2 className="mt-1.5 text-xl font-extrabold text-white leading-tight">{recipe.title}</h2>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-sm text-stone-600">
            {recipe.cuisine && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">{recipe.cuisine}</span>}
            {recipe.totalTimeMinutes && <span className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium"><Clock size={12} /> {recipe.totalTimeMinutes} min</span>}
            {recipe.servings && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">{recipe.servings} servings</span>}
            {recipe.difficulty && <span className={`rounded-full px-3 py-1 text-xs font-medium ${recipe.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700" : recipe.difficulty === "Medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{recipe.difficulty}</span>}
            {recipe.diets.map(d => <span key={d} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{d}</span>)}
          </div>

          {/* Nutrition */}
          {(recipe.calories || recipe.protein) && (
            <div className="grid grid-cols-4 gap-2">
              {[["Calories", recipe.calories, ""], ["Protein", recipe.protein, "g"], ["Carbs", recipe.carbs, "g"], ["Fat", recipe.fat, "g"]].map(([label, val, unit]) =>
                val != null ? (
                  <div key={String(label)} className={`rounded-2xl p-2.5 text-center ${label === "Calories" ? "bg-amber-50" : "bg-stone-50"}`}>
                    <p className="text-xs text-stone-500">{label}</p>
                    <p className="font-bold text-stone-900 text-sm">{Math.round(Number(val))}{unit}</p>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-800 mb-2.5">Ingredients</h3>
              <ul className="divide-y divide-stone-100">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-3 py-2 text-sm">
                    {ing.amount && <span className="w-16 shrink-0 font-medium text-emerald-700">{ing.amount} {ing.unit ?? ""}</span>}
                    <span className="text-stone-800">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions.length > 0 ? (
            <div>
              <h3 className="font-semibold text-stone-800 mb-2.5">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((s, i) => (
                  <li key={i} onClick={() => setStep(step === i ? null : i)} className={`flex gap-3 cursor-pointer rounded-2xl p-3 transition ${step === i ? "bg-emerald-50" : "hover:bg-stone-50"}`}>
                    <span className={`shrink-0 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${step === i ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-700"}`}>{i + 1}</span>
                    <p className="text-sm leading-relaxed text-stone-800 pt-0.5">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-800">
              <Info size={16} className="shrink-0 mt-0.5" />
              <div>
                Full instructions are at the original source.
                {recipe.sourceUrl && (
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600 transition">
                    <ExternalLink size={12} /> View recipe
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Cultural note */}
          {recipe.culturalNote && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-800">💡 Did you know? </span>{recipe.culturalNote}
            </div>
          )}

          {/* Source link */}
          {recipe.sourceUrl && (
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition">
              <ExternalLink size={15} /> View on {recipe.source === "spoonacular" ? "Spoonacular" : recipe.source === "edamam" ? "Edamam" : "original source"}
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
  const [recipes, setRecipes] = useState<ExternalRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ExternalRecipe | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const source = getExploreSource();
  const totalPages = Math.ceil(total / 20);

  const load = useCallback(async (f: ExploreFilters) => {
    setLoading(true);
    const result = await searchExternalRecipes(f);
    setRecipes(result.recipes);
    setTotal(result.total);
    setHasMore(result.hasMore);
    setLoading(false);
  }, []);

  useEffect(() => { load(filters); }, [filters, load]);

  function handleQueryChange(v: string) {
    setInputValue(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilters(f => ({ ...f, query: v, page: 1 })), 400);
  }

  function set(key: keyof ExploreFilters, val: unknown) {
    setFilters(f => ({ ...f, [key]: val, page: 1 }));
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} className="text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">World Recipes</p>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">Explore Global Cuisine</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Discover authentic recipes from cuisines around the world — search, filter by cuisine, diet, or cooking time.
        </p>
      </header>

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            value={inputValue}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search any cuisine, dish, or ingredient…"
            className="w-full rounded-full border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition ${filtersOpen ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {/* Expanded filters */}
      {filtersOpen && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Cuisine</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {CUISINES.map(c => (
                  <button key={c} onClick={() => set("cuisine", filters.cuisine === c ? "" : c)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium border transition ${filters.cuisine === c ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Diet</p>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map(d => (
                  <button key={d} onClick={() => set("diet", filters.diet === d ? "" : d)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium border transition ${filters.diet === d ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Max Time</p>
              <div className="flex flex-wrap gap-1.5">
                {TIMES.map(t => (
                  <button key={t.value} onClick={() => set("maxTime", filters.maxTime === t.value ? null : t.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium border transition ${filters.maxTime === t.value ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Sort</p>
              <div className="flex flex-wrap gap-1.5">
                {[["popular", "Most popular"], ["rating", "Highest rated"], ["fastest", "Fastest"]].map(([v, l]) => (
                  <button key={v} onClick={() => set("sort", v as ExploreFilters["sort"])}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium border transition ${filters.sort === v ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-200 text-stone-600 hover:border-emerald-300"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => { setFilters(DEFAULT_FILTERS); setInputValue(""); }} className="text-xs text-stone-500 hover:text-stone-700 transition">
            Clear all filters
          </button>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600">
          {loading ? "Searching…" : <><span className="font-semibold text-stone-900">{total.toLocaleString()}</span> recipes found</>}
        </p>
        <SourceBadge source={source} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 bg-white animate-pulse">
              <div className="aspect-[4/3] bg-stone-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded-lg bg-stone-200" />
                <div className="h-3 w-1/2 rounded-lg bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl mb-4">🍽️</span>
          <h3 className="text-lg font-semibold text-stone-800 mb-1">No recipes found</h3>
          <p className="text-sm text-stone-500">Try different search terms or clear your filters.</p>
          <button onClick={() => { setFilters(DEFAULT_FILTERS); setInputValue(""); }} className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {recipes.map(recipe => (
            <ExploreCard key={recipe.id} recipe={recipe} onClick={() => setSelected(recipe)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => set("page", filters.page - 1)} disabled={filters.page === 1}
            className="grid h-9 w-9 place-items-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-stone-600">Page {filters.page} of {totalPages}</span>
          <button onClick={() => set("page", filters.page + 1)} disabled={!hasMore && filters.page >= totalPages}
            className="grid h-9 w-9 place-items-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Detail panel */}
      {selected && <DetailPanel recipe={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
