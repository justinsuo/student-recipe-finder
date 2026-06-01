"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Clock, Coins, Flame, ListChecks, Soup } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/AppStore";
import type { Recipe, RecipeScoreResult } from "@/lib/types";
import { calculateCostPerServing } from "@/lib/recipeScoring";

interface Props {
  result?: RecipeScoreResult;
  recipe?: Recipe;
  highlight?: string;
}

const equipmentLabel: Record<string, string> = {
  microwave: "Microwave",
  stovetop: "Stovetop",
  oven: "Oven",
  "rice-cooker": "Rice cooker",
  "air-fryer": "Air fryer",
  "no-kitchen": "No kitchen",
};

export function RecipeCard({ result, recipe, highlight }: Props) {
  const { isSaved, toggleSaved } = useAppStore();
  const r = result?.recipe ?? recipe;
  if (!r) return null;
  const saved = isSaved(r.id);
  const costPerServing = result?.costPerServing ?? calculateCostPerServing(r);

  return (
    <Link
      href={`/recipes/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div
        className={`relative flex h-32 items-center justify-center ${r.accentColor}`}
      >
        <span className="text-5xl" aria-hidden>
          {r.emoji}
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleSaved(r.id);
          }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm transition-colors hover:bg-white"
          aria-label={saved ? "Remove from saved" : "Save recipe"}
        >
          {saved ? (
            <BookmarkCheck size={16} className="text-emerald-600" />
          ) : (
            <Bookmark size={16} />
          )}
        </button>
        {result && result.matchPercent > 0 && (
          <div className="absolute left-3 top-3">
            <Badge tone="emerald">
              {result.matchPercent}% match
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-700">
            {r.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">
            {r.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="green" icon={<Coins size={12} />}>
            ${costPerServing.toFixed(2)}/serving
          </Badge>
          <Badge tone="amber" icon={<Clock size={12} />}>
            {r.totalTimeMinutes} min
          </Badge>
          <Badge tone="stone" icon={<Flame size={12} />}>
            {r.difficulty}
          </Badge>
          <Badge tone="violet" icon={<Soup size={12} />}>
            {equipmentLabel[r.equipment[0]] ?? r.equipment[0]}
          </Badge>
        </div>

        {(r.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {r.tags!.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {result && result.missingIngredients.length > 0 && (
          <div className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
            <p className="flex items-center gap-1.5 font-medium text-stone-800">
              <ListChecks size={12} />
              {result.missingIngredients.length === 1
                ? "Missing 1 item"
                : `Missing ${result.missingIngredients.length} items`}
              {result.missingCost > 0 && (
                <span className="text-emerald-700">
                  · ~${result.missingCost.toFixed(2)}
                </span>
              )}
            </p>
          </div>
        )}

        {highlight && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {highlight}
          </div>
        )}

        {result && result.reasons.length > 0 && !highlight && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {result.reasons[0]}
          </div>
        )}

        <div className="mt-auto pt-1">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:underline">
            Cook this →
          </span>
        </div>
      </div>
    </Link>
  );
}
