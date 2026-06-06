"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Bookmark, BookmarkCheck, Clock, Coins, ListChecks, Flame, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/AppStore";
import type { Recipe, RecipeScoreResult } from "@/lib/types";
import { calculateCostPerServing } from "@/lib/recipeScoring";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { RecipeImage } from "./RecipeImage";
import { EquipmentBadges } from "./EquipmentBadge";
import { CategoryChip } from "@/components/ui/CategoryChip";

// Spring config tuned for "premium app" feel — fast enough that hover
// doesn't lag, soft enough that the card settles rather than snapping.
const CARD_SPRING = { type: "spring", stiffness: 320, damping: 24, mass: 0.6 } as const;

interface Props {
  result?: RecipeScoreResult;
  recipe?: Recipe;
  highlight?: string;
  /**
   * Source slug used by RecipeDetailClient's back-link so users return to
   * the right catalog (cheap, nourish-recipes, saved, pantry, explore).
   * When omitted the detail page falls back to "Back to recipes".
   */
  from?: string;
}

export function RecipeCard({ result, recipe, highlight, from }: Props) {
  const { isSaved, toggleSaved } = useAppStore();
  const r = result?.recipe ?? recipe;
  if (!r) return null;
  const saved = isSaved(r.id);
  const rawCost = result?.costPerServing ?? calculateCostPerServing(r);
  const costPerServing = Number.isFinite(rawCost) && rawCost > 0 ? rawCost : null;
  const nutrition = bestEffortNutrition(r).estimate;
  const hasNutrition = nutrition.calories > 0 || nutrition.protein > 0;
  const href = from ? `/recipes/${r.id}?from=${from}` : `/recipes/${r.id}`;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.012 }}
      whileTap={{ scale: 0.985 }}
      transition={CARD_SPRING}
      className="h-full"
    >
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8D8C4] bg-white shadow-sm transition-shadow duration-300 hover:border-[#B6E8CD] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2FBF71]"
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
              <CategoryChip key={t} category={t} />
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
          {/* Tactile basil pill replaces the old text-link. Renders as
              part of the parent Link so the whole card is still one
              click target — just visually obvious. */}
          <span
            aria-hidden
            className="inline-flex items-center gap-1.5 rounded-full border-b-[3px] border-[#16834A] bg-gradient-to-b from-[#3AD081] to-[#2FBF71] px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition-all motion-safe:group-hover:-translate-y-px"
          >
            Cook this
            <ArrowRight
              size={12}
              strokeWidth={2.6}
              className="transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
    </motion.div>
  );
}
