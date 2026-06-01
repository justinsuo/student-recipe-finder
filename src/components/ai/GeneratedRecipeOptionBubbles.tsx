"use client";

import { ChefHat, Clock, Coins, Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { GeneratedRecipeOption } from "@/lib/workerClient";

const LABEL_TONES: Record<string, string> = {
  "best-match": "bg-emerald-600 text-white",
  cheapest: "bg-amber-500 text-white",
  fastest: "bg-sky-600 text-white",
  "most-creative": "bg-violet-600 text-white",
  "uses-most-pantry": "bg-green-700 text-white",
  "high-protein": "bg-rose-600 text-white",
  "comfort-food": "bg-orange-500 text-white",
  wildcard: "bg-pink-500 text-white",
};

const LABEL_TEXT: Record<string, string> = {
  "best-match": "Best match",
  cheapest: "Cheapest",
  fastest: "Fastest",
  "most-creative": "Most creative",
  "uses-most-pantry": "Uses most pantry",
  "high-protein": "High protein",
  "comfort-food": "Comfort food",
  wildcard: "Wildcard",
};

interface Props {
  options: GeneratedRecipeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Map of optionId → data-url for already-generated images */
  images: Record<string, string | undefined>;
  /** Set of optionIds where an image is currently being generated */
  generatingImageIds: Set<string>;
}

export function GeneratedRecipeOptionBubbles({
  options,
  selectedId,
  onSelect,
  images,
  generatingImageIds,
}: Props) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <ul className="flex w-max items-stretch gap-3 pb-2">
        {options.map((o) => {
          const active = o.id === selectedId;
          const img = images[o.id];
          const generating = generatingImageIds.has(o.id);
          const tone = LABEL_TONES[o.optionLabel] ?? "bg-stone-600 text-white";
          const labelText = LABEL_TEXT[o.optionLabel] ?? o.optionLabel;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                aria-pressed={active}
                className={clsx(
                  "group flex w-56 flex-col overflow-hidden rounded-2xl text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  active
                    ? "border-2 border-emerald-600 bg-white shadow-md"
                    : "border border-stone-200 bg-white hover:-translate-y-0.5 hover:shadow-md",
                )}
              >
                <div className="relative h-24 bg-stone-100">
                  {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img}
                      alt={o.recipe.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : generating ? (
                    <div className="flex h-full items-center justify-center text-stone-500">
                      <Loader2 size={16} className="mr-1.5 animate-spin" />
                      <span className="text-xs">Generating…</span>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 text-stone-400">
                      <ChefHat size={28} />
                    </div>
                  )}
                  <span
                    className={clsx(
                      "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm",
                      tone,
                    )}
                  >
                    {labelText}
                  </span>
                  {active && (
                    <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-stone-900 group-hover:text-emerald-700">
                    {o.recipe.name}
                  </p>
                  <p className="line-clamp-2 text-xs text-stone-500">
                    {o.shortReason}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-700">
                    <span className="inline-flex items-center gap-0.5">
                      <Coins size={10} />$
                      {Number.isFinite(Number(o.recipe.estimatedCostPerServing)) ? Number(o.recipe.estimatedCostPerServing).toFixed(2) : "—"}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Clock size={10} />
                      {o.recipe.totalTimeMinutes} min
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
