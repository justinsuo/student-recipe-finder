"use client";

import { useState } from "react";
import { Pencil, Check, RotateCcw } from "lucide-react";
import {
  deleteOverride,
  getOverride,
  setOverride,
} from "@/lib/pricing/locationStorage";
import { quoteIngredient } from "@/lib/pricing/pricingEngine";
import type { Ingredient } from "@/lib/types";

interface Props {
  ingredient: Ingredient;
  quantity: number;
  optional?: boolean;
  onChange?: () => void;
}

/**
 * Renders a single cost-breakdown row with an inline editor for the per-unit
 * price. Edits are stored as user overrides and apply globally to every
 * recipe that uses the ingredient.
 */
export function IngredientPriceRow({
  ingredient,
  quantity,
  optional,
  onChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");
  const override = getOverride(ingredient.id);
  const quote = quoteIngredient(ingredient.id, quantity);
  const cost = quote?.totalCost ?? 0;

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

  return (
    <li className="flex items-start justify-between gap-3 py-2 text-sm">
      <div className="min-w-0">
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
          <p className="mt-1 text-[11px] text-stone-500">
            ${(quote?.appliedUnitCost ?? 0).toFixed(2)}/{ingredient.unit}
            {quote && quote.source === "override" && (
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                your price
              </span>
            )}
            {quote && quote.source === "catalog" && quote.multiplier !== 1 && (
              <span className="ml-1 text-stone-400">
                · base ${quote.baseUnitCost.toFixed(2)} × {quote.multiplier.toFixed(2)} ({quote.regionLabel})
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="font-medium text-stone-900">${cost.toFixed(2)}</p>
        {!editing && (
          <div className="flex items-center gap-1">
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
