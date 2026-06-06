"use client";

import { useEffect, useState } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { addDiaryEntry, newId, todayString } from "@/lib/nourish/storage";
import type { DiaryEntry, FoodItem, MealSlot } from "@/lib/nourish/types";

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

/**
 * Quick-add macros sheet. For when the user knows the numbers from a
 * nutrition label and doesn't want to search for an exact food. Creates a
 * one-shot FoodItem with source: "custom" and pushes it to today's diary.
 *
 * UX rule: all numeric fields start empty and the meal slot starts
 * untouched. "Log to today" stays disabled until the user picks a slot
 * AND types at least one positive macro value — otherwise a stray tap
 * would log fake default numbers (200 kcal / 10 P / 25 C / 5 F) into
 * the diary and corrupt the day's totals.
 */
export function QuickAddMacrosModal({
  defaultSlot = "snack",
  onClose,
  onLogged,
}: {
  defaultSlot?: MealSlot;
  onClose: () => void;
  onLogged: () => void;
}) {
  const toast = useToast();
  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [slotTouched, setSlotTouched] = useState(false);
  const [name, setName] = useState("");
  // String-backed so empty is a real state, not "0". Save coerces.
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  function pickSlot(next: MealSlot) {
    setSlot(next);
    setSlotTouched(true);
  }

  // Escape closes — matches AddFoodModal so the close path is the same
  // everywhere in /nourish/log-food.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsed = {
    kcal: Math.max(0, Math.round(Number(calories) || 0)),
    protein: Math.max(0, Number(protein) || 0),
    carbs: Math.max(0, Number(carbs) || 0),
    fat: Math.max(0, Number(fat) || 0),
  };
  const hasAnyValue = parsed.kcal + parsed.protein + parsed.carbs + parsed.fat > 0;
  const canSubmit = slotTouched && hasAnyValue;

  function save() {
    if (!canSubmit) return;
    const cleanName = name.trim() || "Quick add";
    const food: FoodItem = {
      id: `qa-${newId()}`,
      source: "custom",
      name: cleanName,
      servingDescription: "1 portion",
      kcal: parsed.kcal,
      proteinG: parsed.protein,
      carbG: parsed.carbs,
      fatG: parsed.fat,
    };
    const entry: DiaryEntry = {
      id: newId(),
      date: todayString(),
      meal: slot,
      food,
      quantityServings: 1,
      snapshotKcal: food.kcal,
      snapshotProteinG: food.proteinG,
      snapshotCarbG: food.carbG,
      snapshotFatG: food.fatG,
      loggedAt: new Date().toISOString(),
    };
    addDiaryEntry(entry);
    onLogged();
    toast.success(
      `Logged "${cleanName}" — ${food.kcal} kcal to ${slot}.`,
    );
    onClose();
  }

  // Tell the user what's missing instead of just disabling the button.
  const blockReason = !slotTouched
    ? "Pick a meal slot first."
    : !hasAnyValue
      ? "Enter at least one value before logging."
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick add macros"
        className="relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl motion-safe:animate-[fadeUp_240ms_ease-out] sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sm shadow-sky-200">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                Nourish
              </p>
              <p className="text-sm font-semibold text-stone-900">
                Quick add macros
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-xs text-stone-600">
            Punch in numbers from a nutrition label or a back-of-napkin
            estimate. Logs as a one-off entry — won&apos;t be saved as a
            reusable food.
          </p>

          <div className="flex flex-wrap gap-2">
            {SLOTS.map(({ value, label }) => {
              const active = slotTouched && slot === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => pickSlot(value)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 motion-safe:scale-[1.02]"
                      : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Name (optional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Protein bar / leftover pasta"
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Num label="Calories" unit="kcal" value={calories} set={setCalories} />
            <Num label="Protein" unit="g" value={protein} set={setProtein} />
            <Num label="Carbs" unit="g" value={carbs} set={setCarbs} />
            <Num label="Fat" unit="g" value={fat} set={setFat} />
          </div>

          <Button onClick={save} disabled={!canSubmit}>
            Log to today
          </Button>
          {blockReason && (
            <p className="text-[11px] text-stone-500" aria-live="polite">
              {blockReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Num({
  label,
  unit,
  value,
  set,
}: {
  label: string;
  unit: string;
  /** String-backed so the field can be genuinely empty. */
  value: string;
  set: (s: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          min={0}
          value={value}
          placeholder="0"
          onChange={(e) => set(e.target.value)}
          className="w-full bg-transparent text-lg font-semibold tabular-nums text-stone-900 outline-none placeholder:text-stone-300"
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          {unit}
        </span>
      </div>
    </label>
  );
}
