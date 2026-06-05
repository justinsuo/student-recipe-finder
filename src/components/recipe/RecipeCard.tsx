"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Clock, Coins, ListChecks, Flame, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/AppStore";
import type { Recipe, RecipeScoreResult } from "@/lib/types";
import { calculateCostPerServing } from "@/lib/recipeScoring";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { RecipeImage } from "./RecipeImage";
import { EquipmentBadges } from "./EquipmentBadge";
import { TagChip } from "@/components/ui/TagChip";

interface Props {
  result?: RecipeScoreResult;
  recipe?: Recipe;
  highlight?: string;
}

export function RecipeCard({ result, recipe, highlight }: Props) {
  const { isSaved, toggleSaved } = useAppStore();
  const r = result?.recipe ?? recipe;
  if (!r) return null;
  const saved = isSaved(r.id);
  const rawCost = result?.costPerServing ?? calculateCostPerServing(r);
  const costPerServing = Number.isFinite(rawCost) && rawCost > 0 ? rawCost : null;
  const nutrition = bestEffortNutrition(r).estimate;
  const hasNutrition = nutrition.calories > 0 || nutrition.protein > 0;

  return (
    <Link
      href={`/recipes/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="relative">
        <RecipeImage recipe={r} variant="card" />

        {/* Save button — frosted-glass pill, top-right. Pops on click. */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleSaved(r.id);
          }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-white active:scale-95"
          aria-label={saved ? "Remove from saved" : "Save recipe"}
        >
          {saved ? (
            <BookmarkCheck
              size={16}
              className="text-emerald-600 motion-safe:animate-[popIn_240ms_ease-out]"
            />
          ) : (
            <Bookmark size={16} />
          )}
        </button>

        {/* Pantry match — top-left, frosted */}
        {result && result.matchPercent > 0 && (
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow shadow-emerald-900/30 backdrop-blur">
              {result.matchPercent}% match
            </span>
          </div>
        )}

        {/* Cost + time — frosted glass row at the bottom of the image */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
          {costPerServing !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm backdrop-blur">
              <Coins size={11} /> ${costPerServing.toFixed(2)}
              <span className="font-normal text-stone-500">/serving</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm backdrop-blur">
            <Clock size={11} /> {r.totalTimeMinutes} min
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold leading-tight text-stone-900 transition-colors group-hover:text-emerald-700">
            {r.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-600">
            {r.description}
          </p>
        </div>

        <EquipmentBadges recipe={r} />

        {hasNutrition && (
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Flame size={12} className="text-orange-500" />
            <span className="font-medium text-stone-700">
              {nutrition.calories} cal
            </span>
            <span className="text-stone-300">·</span>
            <span className="font-medium text-stone-700">
              {nutrition.protein}g protein
            </span>
          </div>
        )}

        {(r.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {r.tags!.slice(0, 3).map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
        )}

        {result && result.missingIngredients.length > 0 && (
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-100">
            <p className="flex items-center gap-1.5 font-medium">
              <ListChecks size={12} />
              {result.missingIngredients.length === 1
                ? "Missing 1 item"
                : `Missing ${result.missingIngredients.length} items`}
              {result.missingCost > 0 && (
                <span className="ml-auto text-amber-800">
                  ~${result.missingCost.toFixed(2)} to buy
                </span>
              )}
            </p>
          </div>
        )}

        {highlight && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-100">
            {highlight}
          </div>
        )}

        {result && result.reasons.length > 0 && !highlight && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-100">
            {result.reasons[0]}
          </div>
        )}

        <div className="mt-auto border-t border-stone-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            Cook this
            <ArrowRight
              size={14}
              className="transition-transform motion-safe:group-hover:translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
