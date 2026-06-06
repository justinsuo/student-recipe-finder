"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Apple, CheckCircle2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectablePill } from "@/components/ui/SelectablePill";
import { addDiaryEntry, newId, todayString } from "@/lib/nourish/storage";
import type { FoodItem, MealSlot } from "@/lib/nourish/types";
import type { GeneratedRecipe } from "@/lib/workerClient";

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

interface Props {
  recipe: GeneratedRecipe;
  /** Optional id of the saved CustomRecipe so we can link in the diary. */
  savedId?: string;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * "Log to Nourish" sidecar for AI Chef generated recipes. Mirrors the
 * existing LogRecipeButton (seed Recipe variant) but reads from the
 * GeneratedRecipe shape — uses recalculated nutrition, never the model's
 * estimatedNutrition directly when a numeric value isn't there.
 */
export function LogGeneratedRecipeButton({ recipe, savedId }: Props) {
  const [open, setOpen] = useState(false);
  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<MealSlot>("lunch");
  const [done, setDone] = useState(false);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
  }, []);

  const kcal = num(recipe.estimatedNutrition?.calories);
  const proteinG = num(recipe.estimatedNutrition?.protein);
  const carbG = num(recipe.estimatedNutrition?.carbs);
  const fatG = num(recipe.estimatedNutrition?.fat);

  const food: FoodItem = {
    id: savedId ? `recipe-${savedId}` : `aichef-${recipe.name}`,
    source: "recipe",
    externalId: savedId,
    name: recipe.name,
    servingDescription: `1 serving (~${Math.round(kcal)} kcal)`,
    kcal,
    proteinG,
    carbG,
    fatG,
  };

  function handleLog() {
    addDiaryEntry({
      id: newId(),
      date: todayString(),
      meal,
      food,
      quantityServings: servings,
      snapshotKcal: food.kcal,
      snapshotProteinG: food.proteinG,
      snapshotCarbG: food.carbG,
      snapshotFatG: food.fatG,
      loggedAt: new Date().toISOString(),
    });
    setDone(true);
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    doneTimeoutRef.current = setTimeout(() => {
      setDone(false);
      setOpen(false);
    }, 1500);
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
      >
        <div className="flex items-center gap-2">
          <Apple size={15} className="text-emerald-600" />
          <span className="text-sm font-semibold text-stone-800">
            Log to Nourish
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">
            {Math.round(kcal)} kcal · {Math.round(proteinG)} g P per serving
          </span>
          {open ? (
            <ChevronUp size={14} className="text-stone-400" />
          ) : (
            <ChevronDown size={14} className="text-stone-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-stone-100 px-4 py-3">
          {done ? (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle2
                size={18}
                className="text-emerald-500 motion-safe:animate-[popIn_220ms_ease-out]"
              />
              <p className="text-sm font-semibold text-stone-800">
                Logged to {MEAL_LABELS[meal]}!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs font-medium text-stone-600">
                  Servings
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease servings"
                    onClick={() =>
                      setServings((s) =>
                        Math.max(0.5, parseFloat((s - 0.5).toFixed(1))),
                      )
                    }
                    className="grid h-7 w-7 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {servings}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase servings"
                    onClick={() =>
                      setServings((s) =>
                        parseFloat((s + 0.5).toFixed(1)),
                      )
                    }
                    className="grid h-7 w-7 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    +
                  </button>
                </div>
                <span
                  className={clsx(
                    "text-xs tabular-nums",
                    Math.round(kcal * servings) > 0
                      ? "text-stone-500"
                      : "text-stone-300",
                  )}
                >
                  = {Math.round(kcal * servings)} kcal
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="w-16 text-xs font-medium text-stone-600" id="log-gen-recipe-meal-label">
                  Meal
                </span>
                <div role="radiogroup" aria-labelledby="log-gen-recipe-meal-label" className="flex flex-wrap items-center gap-2">
                  {(
                    Object.entries(MEAL_LABELS) as [MealSlot, string][]
                  ).map(([id, label]) => (
                    <SelectablePill
                      key={id}
                      active={meal === id}
                      onClick={() => setMeal(id)}
                      ariaSemantics="checked"
                      showCheck={false}
                      size="sm"
                    >
                      {label}
                    </SelectablePill>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={13} />}
                onClick={handleLog}
                className="w-full"
              >
                Add to {MEAL_LABELS[meal]}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
