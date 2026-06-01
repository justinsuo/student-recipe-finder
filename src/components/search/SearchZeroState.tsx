"use client";

import Link from "next/link";
import { Sparkles, X, ChefHat, AlertCircle } from "lucide-react";
import type { RecipeSearchIndexItem } from "@/lib/search/recipeSearch";
import { bestFuzzyMatch } from "@/lib/search/fuzzyMatch";
import { Button } from "@/components/ui/Button";

interface Props {
  query: string;
  /** Filters that ARE hiding results (label + clear callback) */
  hidingFilters?: { label: string; clear: () => void }[];
  /** If true, there ARE matches in the catalog but filters wipe them out */
  filtersHidingMatches?: boolean;
  onClearAll?: () => void;
  onApplySuggestion?: (suggestion: string) => void;
  index: RecipeSearchIndexItem[];
}

export function SearchZeroState({
  query,
  hidingFilters = [],
  filtersHidingMatches,
  onClearAll,
  onApplySuggestion,
  index,
}: Props) {
  // Build "did you mean" candidates from recipe titles + ingredient names
  const haystack = new Set<string>();
  for (const it of index) {
    haystack.add(it.title);
    for (const ing of it.ingredients) haystack.add(ing);
  }
  const candidates = Array.from(haystack);
  const fuzzy = query.trim() ? bestFuzzyMatch(query.trim(), candidates) : null;
  const moreSuggestions = candidates
    .filter((c) => fuzzy && c !== fuzzy.match && c.toLowerCase().includes(query.trim().slice(0, 4).toLowerCase()))
    .slice(0, 4);

  const aiChefUrl = `/ai-chef?notes=${encodeURIComponent(`Make me a recipe based on: ${query}`)}`;

  return (
    <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-stone-100 text-stone-500">
          <ChefHat size={20} />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-base font-semibold text-stone-900">
              No recipes found for &ldquo;{query}&rdquo;
            </p>
            {filtersHidingMatches && (
              <p className="mt-1 flex items-start gap-1 text-sm text-amber-800">
                <AlertCircle size={14} className="mt-0.5 flex-none" />
                Your search has matches, but active filters are hiding them.
              </p>
            )}
          </div>

          {fuzzy && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Did you mean
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onApplySuggestion?.(fuzzy.match)}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  {fuzzy.match}
                </button>
                {moreSuggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => onApplySuggestion?.(s)}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hidingFilters.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Try removing a filter
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {hidingFilters.map((f, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={f.clear}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    {f.label} <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {onClearAll && (
              <Button variant="outline" size="sm" onClick={onClearAll}>
                Clear search & filters
              </Button>
            )}
            <Link
              href={aiChefUrl}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Sparkles size={12} /> Ask AI Chef to make one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
