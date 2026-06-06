"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddFoodModal } from "./AddFoodModal";
import {
  getCustomFoods,
  deleteCustomFood,
  todayString,
  newId,
  addDiaryEntry,
} from "@/lib/nourish/storage";
import type { FoodItem, MealSlot } from "@/lib/nourish/types";

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function FoodsView() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [logMeal, setLogMeal] = useState<MealSlot>("lunch");
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up the row-flash timer on unmount so a quick navigate-away
  // doesn't fire setFlash(null) on an unmounted component.
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  const load = useCallback(() => {
    setFoods(getCustomFoods());
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );

  function handleDelete(id: string) {
    deleteCustomFood(id);
    load();
  }

  function handleQuickLog(food: FoodItem) {
    addDiaryEntry({
      id: newId(),
      date: todayString(),
      meal: logMeal,
      food,
      quantityServings: 1,
      snapshotKcal: food.kcal,
      snapshotProteinG: food.proteinG,
      snapshotCarbG: food.carbG,
      snapshotFatG: food.fatG,
      loggedAt: new Date().toISOString(),
    });
    setFlash(food.id);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 1200);
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search saved foods…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setShowModal(true)}
        >
          New food
        </Button>
      </div>

      {/* Meal log target (quick-log control) */}
      <div className="flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
        <span className="text-xs font-medium text-stone-600 shrink-0">Log to:</span>
        {(Object.entries(MEAL_LABELS) as [MealSlot, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLogMeal(id)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              logMeal === id
                ? "bg-emerald-600 text-white"
                : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Food list */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="🥘"
          title={query ? `No foods matching "${query}"` : "No custom foods yet"}
          description={
            query
              ? "Try a different search term."
              : "Create custom foods here for one-tap logging. They'll also appear in the search tab of Add Food."
          }
          tone="emerald"
          action={
            !query ? (
              <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowModal(true)}>
                Create first food
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((food) => (
            <div
              key={food.id}
              className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-3 py-2.5"
            >
              {/* Tap to quick-log */}
              <button
                type="button"
                onClick={() => {
                  handleQuickLog(food);
                }}
                className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                aria-label={`Log ${food.name}`}
              >
                <p className="truncate text-sm font-medium text-stone-900">{food.name}</p>
                <p className="text-[10px] text-stone-400">
                  {food.servingDescription} · {food.kcal} kcal · {food.proteinG}g P
                </p>
              </button>

              {flash === food.id ? (
                <span className="text-xs font-semibold text-emerald-600 shrink-0">✓ Logged!</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(food.id)}
                  aria-label={`Delete ${food.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 hover:bg-rose-50 hover:text-rose-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddFoodModal
          onClose={() => setShowModal(false)}
          onLogged={() => { load(); setShowModal(false); }}
        />
      )}
    </div>
  );
}
