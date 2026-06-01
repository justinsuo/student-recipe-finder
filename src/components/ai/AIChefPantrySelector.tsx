"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Clock4,
  Plus,
  Refrigerator,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/lib/AppStore";
import { INGREDIENT_MAP } from "@/data/ingredients";
import { getCustomIngredients } from "@/lib/customIngredientStorage";

interface Props {
  /**
   * Controlled set of pantry-ingredient IDs to *include* in the next AI Chef
   * request. Parent owns the state. Child renders the chip toggles.
   */
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}

/**
 * Pantry chip selector for AI Chef. Reads from the same AppStore the
 * /pantry page writes to, so additions/removals propagate live.
 *
 * Each chip is a checkbox: clicking toggles "include this ingredient in the
 * current request" without ever modifying the underlying pantry. To remove
 * an item from the pantry entirely, use the Pantry page directly — tapping
 * a chip here only toggles inclusion in this recipe.
 */
export function AIChefPantrySelector({ selectedIds, onChange }: Props) {
  const { pantry, hydrated } = useAppStore();
  const [customIngredientsTick, setCustomIngredientsTick] = useState(0);

  // Re-read custom ingredient names whenever the pantry mutates, since
  // PantrySmartAdd / PantryVoiceInput might add new ones.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomIngredientsTick((n) => n + 1);
  }, [pantry]);

  const customMap = useMemo(() => {
    // Depend on customIngredientsTick so we re-read after pantry mutations
    void customIngredientsTick;
    if (typeof window === "undefined") return new Map<string, { id: string; name: string }>();
    const list = getCustomIngredients();
    return new Map(list.map((c) => [c.id, { id: c.id, name: c.displayName || c.canonicalName }]));
  }, [customIngredientsTick]);

  const items = pantry
    .map((p) => {
      const builtin = INGREDIENT_MAP.get(p.ingredientId);
      if (builtin) return { id: builtin.id, name: builtin.name, useSoon: !!p.useSoon, custom: false };
      const c = customMap.get(p.ingredientId);
      if (c) return { id: c.id, name: c.name, useSoon: !!p.useSoon, custom: true };
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
        Loading pantry…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 p-5 text-center">
        <Refrigerator size={28} className="mx-auto text-stone-400" />
        <p className="mt-2 text-sm font-semibold text-stone-900">
          Your pantry is empty
        </p>
        <p className="mt-1 text-xs text-stone-600">
          Add what you have so AI Chef can build recipes from your actual
          ingredients.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link
            href="/pantry"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Refrigerator size={12} /> Go to Pantry
          </Link>
        </div>
      </div>
    );
  }

  const selectAll = () => onChange(new Set(items.map((i) => i.id)));
  const selectNone = () => onChange(new Set());

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Step 1 · Pick ingredients AI Chef can use
      </p>
      <p className="mb-3 text-xs text-stone-500">
        Everything in your pantry is selected by default. Uncheck anything
        you don&apos;t want in this recipe — items stay in your pantry either way.
      </p>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-700">
          <span className="font-semibold text-emerald-700">
            {selectedIds.size} of {items.length}
          </span>{" "}
          pantry {items.length === 1 ? "item" : "items"} selected
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            Select none
          </button>
          <Link
            href="/pantry"
            className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <Refrigerator size={11} /> Edit pantry
          </Link>
        </div>
      </div>

      <ul className="flex flex-wrap gap-2">
        {items.map((it) => {
          const active = selectedIds.has(it.id);
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => toggle(it.id)}
                aria-pressed={active}
                title={
                  active
                    ? "Tap to exclude from this recipe"
                    : "Tap to include in this recipe"
                }
                className={
                  active
                    ? "inline-flex items-center gap-1 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    : "inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                }
              >
                {active ? <Check size={11} /> : <Plus size={11} />}
                {it.name}
                {it.useSoon && (
                  <span
                    className={
                      active
                        ? "ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-amber-200 px-1 text-[9px] font-semibold text-amber-900"
                        : "ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1 text-[9px] font-semibold text-amber-800"
                    }
                  >
                    <Clock4 size={9} /> use soon
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-stone-500">
        <Sparkles size={10} /> AI Chef will prioritize these and only suggest
        cheap items you don&apos;t have when needed.
      </p>
    </div>
  );
}
