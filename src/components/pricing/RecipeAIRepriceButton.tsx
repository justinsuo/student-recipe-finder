"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  estimateIngredientPrice,
  isWorkerConfigured,
} from "@/lib/workerClient";
import { applyEstimateToUnit, getAIPrice, setAIPrice } from "@/lib/pricing/aiPriceBook";
import { getLocation } from "@/lib/pricing/locationStorage";
import { getRegion } from "@/lib/pricing/regions";
import { INGREDIENT_MAP } from "@/data/ingredients";
import type { Recipe } from "@/lib/types";

interface Props {
  recipe: Recipe;
  onComplete?: () => void;
}

/**
 * Top-of-breakdown button that asks the AI Worker to price every uncached
 * ingredient in this recipe for the user's current region. Results land in
 * the AI price book and are reused forever (or until the user resets).
 *
 * The button is honest about what's already cached: "Use AI prices (3 cached,
 * 5 to estimate)".
 */
export function RecipeAIRepriceButton({ recipe, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isWorkerConfigured()) return null;

  const loc = getLocation();
  const region = getRegion(loc.regionId);

  // Figure out what's already cached
  const requiredIds = recipe.ingredients
    .filter((ri) => !ri.optional)
    .map((ri) => ri.ingredientId);
  const cachedCount = requiredIds.filter((id) => !!getAIPrice(id, loc.regionId)).length;
  const toEstimate = requiredIds.length - cachedCount;

  async function repriceAll() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ done: 0, total: toEstimate });

    const queue = requiredIds.filter(
      (id) => !getAIPrice(id, loc.regionId) && INGREDIENT_MAP.has(id),
    );
    let done = 0;
    let priced = 0;
    const locationPayload = {
      label: region.label,
    };

    // Parallelize but with a soft concurrency cap so we don't hammer the worker
    const CONCURRENCY = 4;
    const worker = async (id: string) => {
      const ing = INGREDIENT_MAP.get(id);
      if (!ing) return;
      try {
        const res = await estimateIngredientPrice({
          ingredientName: ing.name,
          recipeUnit: ing.unit,
          location: locationPayload,
          preferBudgetStores: true,
        });
        const ppu =
          res.recipeAmountCost && res.recipeAmountCost > 0
            ? undefined
            : applyEstimateToUnit(res.estimate, ing.unit) ?? undefined;
        setAIPrice({
          ingredientId: id,
          regionId: loc.regionId,
          estimate: res.estimate,
          appliedUnitCost: ppu ?? undefined,
          cachedAt: new Date().toISOString(),
        });
        priced++;
      } catch {
        // swallow per-ingredient errors; we'll just keep the catalog fallback
      } finally {
        done++;
        setProgress({ done, total: queue.length });
      }
    };

    const runners: Promise<void>[] = [];
    let cursor = 0;
    function next(): Promise<void> | null {
      if (cursor >= queue.length) return null;
      const id = queue[cursor++];
      return worker(id).then(() => {
        const n = next();
        return n ? n : undefined;
      });
    }
    for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
      const n = next();
      if (n) runners.push(n);
    }
    await Promise.all(runners);

    setLoading(false);
    setSuccess(`Priced ${priced} of ${queue.length} ingredients with AI.`);
    onComplete?.();
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      </div>
    );
  }

  if (cachedCount === requiredIds.length) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
        All ingredient prices in this recipe are already AI-estimated for{" "}
        <span className="font-semibold">{region.shortLabel ?? region.label}</span>.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-violet-100 text-violet-700">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-violet-900">
            Use AI prices
          </p>
          <p className="text-xs text-violet-900">
            Estimate every ingredient with AI web search for{" "}
            {region.shortLabel ?? region.label}.{" "}
            {cachedCount > 0 && (
              <span>
                {cachedCount} already cached, {toEstimate} to estimate.
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={repriceAll}
          disabled={loading || toEstimate === 0}
          size="sm"
          leftIcon={
            loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )
          }
        >
          {loading
            ? `Estimating… (${progress?.done ?? 0}/${progress?.total ?? toEstimate})`
            : `Estimate ${toEstimate}`}
        </Button>
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-700">
          <AlertCircle size={12} className="mt-0.5 flex-none" /> {error}
        </div>
      )}
    </div>
  );
}
