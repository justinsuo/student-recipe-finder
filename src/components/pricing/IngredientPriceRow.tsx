"use client";

import { useState } from "react";
import {
  Pencil,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  deleteOverride,
  getOverride,
  setOverride,
} from "@/lib/pricing/locationStorage";
import { quoteIngredient } from "@/lib/pricing/pricingEngine";
import {
  applyEstimateToUnit,
  getAIPrice,
  setAIPrice,
} from "@/lib/pricing/aiPriceBook";
import { getLocation } from "@/lib/pricing/locationStorage";
import { getRegion } from "@/lib/pricing/regions";
import {
  estimateIngredientPrice,
  isWorkerConfigured,
} from "@/lib/workerClient";
import type { Ingredient } from "@/lib/types";

interface Props {
  ingredient: Ingredient;
  quantity: number;
  optional?: boolean;
  onChange?: () => void;
}

export function IngredientPriceRow({
  ingredient,
  quantity,
  optional,
  onChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);

  const override = getOverride(ingredient.id);
  const quote = quoteIngredient(ingredient.id, quantity);
  const cost = quote?.totalCost ?? 0;

  const loc = getLocation();
  const region = getRegion(loc.regionId);
  const aiCached = getAIPrice(ingredient.id, loc.regionId);

  function startEdit() {
    setDraftPrice((quote?.appliedUnitCost ?? ingredient.estimatedUnitCost).toFixed(2));
    setEditing(true);
  }

  function save() {
    const n = parseFloat(draftPrice);
    if (!Number.isNaN(n) && n >= 0) {
      setOverride(ingredient.id, n, ingredient.unit, "User-edited");
    }
    setEditing(false);
    onChange?.();
  }

  function reset() {
    deleteOverride(ingredient.id);
    setEditing(false);
    onChange?.();
  }

  async function estimateWithAI() {
    setEstimating(true);
    setEstimateError(null);
    try {
      const res = await estimateIngredientPrice({
        ingredientName: ingredient.name,
        recipeUnit: ingredient.unit,
        location: { label: region.label },
        preferBudgetStores: true,
      });
      const ppu =
        applyEstimateToUnit(res.estimate, ingredient.unit) ?? undefined;
      setAIPrice({
        ingredientId: ingredient.id,
        regionId: loc.regionId,
        estimate: res.estimate,
        appliedUnitCost: ppu,
        cachedAt: new Date().toISOString(),
      });
      setShowSources(true);
      onChange?.();
    } catch (e) {
      setEstimateError(
        e instanceof Error ? e.message : "Couldn't estimate this ingredient.",
      );
    } finally {
      setEstimating(false);
    }
  }

  const sourceLabel: Record<string, string> = {
    override: "Your price",
    "ai-estimate": "AI estimate",
    catalog: `${region.shortLabel ?? region.label} estimate`,
    fallback: "Estimate",
  };

  return (
    <li className="flex items-start justify-between gap-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-800">
          {ingredient.name}{" "}
          {optional && (
            <span className="text-xs text-stone-500">(optional)</span>
          )}
        </p>
        <p className="text-xs text-stone-500">
          {quantity} {ingredient.unit}
        </p>

        {editing ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-stone-500">$</span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
            />
            <span className="text-[11px] text-stone-500">/{ingredient.unit}</span>
            <button
              onClick={save}
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white"
            >
              <Check size={11} /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[11px] text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-stone-500">
            <span>
              ${(quote?.appliedUnitCost ?? 0).toFixed(2)}/{ingredient.unit}
            </span>
            <span
              className={
                quote?.source === "override"
                  ? "rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800"
                  : quote?.source === "ai-estimate"
                    ? "rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800"
                    : "rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700"
              }
            >
              {sourceLabel[quote?.source ?? "fallback"]}
              {quote?.confidence && quote.source !== "override" && (
                <> · {quote.confidence}</>
              )}
            </span>
            {quote?.source === "catalog" && quote.multiplier !== 1 && (
              <span className="text-stone-400">
                base ${quote.baseUnitCost.toFixed(2)} × {quote.multiplier.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* AI sources panel */}
        {aiCached && showSources && (
          <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-2 text-xs text-violet-900">
            <p className="font-semibold">
              {aiCached.estimate.selectedBudgetEstimate.packageUnit && (
                <>
                  Selected package: $
                  {aiCached.estimate.selectedBudgetEstimate.packagePrice.toFixed(2)}
                  {" / "}
                  {aiCached.estimate.selectedBudgetEstimate.packageSize}{" "}
                  {aiCached.estimate.selectedBudgetEstimate.packageUnit}
                </>
              )}
            </p>
            <p className="mt-1 text-[11px]">
              Low ${aiCached.estimate.typicalPackage.lowPrice.toFixed(2)} ·
              Avg ${aiCached.estimate.typicalPackage.averagePrice.toFixed(2)} ·
              High ${aiCached.estimate.typicalPackage.highPrice.toFixed(2)}
            </p>
            <p className="mt-1">{aiCached.estimate.explanation}</p>
            {aiCached.estimate.sources?.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {aiCached.estimate.sources.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[11px]">
                    •{" "}
                    {s.sourceUrl ? (
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {s.storeName ?? s.productName ?? "source"}
                      </a>
                    ) : (
                      <span>{s.storeName ?? s.productName ?? "source"}</span>
                    )}{" "}
                    — ${s.packagePrice.toFixed(2)} / {s.packageSize} {s.packageUnit}{" "}
                    <span className="text-violet-700">[{s.confidence}]</span>
                  </li>
                ))}
              </ul>
            )}
            {aiCached.estimate.warnings?.length > 0 && (
              <p className="mt-1 text-[11px] text-amber-900">
                ⚠ {aiCached.estimate.warnings.join(" ")}
              </p>
            )}
          </div>
        )}
        {estimateError && (
          <p className="mt-1 text-[11px] text-red-700">{estimateError}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <p className="font-medium text-stone-900">${cost.toFixed(2)}</p>
        {!editing && (
          <div className="flex items-center gap-1">
            {isWorkerConfigured() && !aiCached && (
              <button
                onClick={estimateWithAI}
                disabled={estimating}
                className="rounded-full p-1 text-violet-500 hover:bg-violet-100 hover:text-violet-700 disabled:opacity-50"
                aria-label="Estimate this ingredient's price with AI"
                title="Estimate with AI"
              >
                {estimating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
              </button>
            )}
            {aiCached && (
              <button
                onClick={() => setShowSources((s) => !s)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Toggle AI price sources"
                title="View AI price sources"
              >
                {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            <button
              onClick={startEdit}
              className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="Edit price"
              title="Edit price"
            >
              <Pencil size={12} />
            </button>
            {override && (
              <button
                onClick={reset}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Reset to catalog price"
                title="Reset to catalog price"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
