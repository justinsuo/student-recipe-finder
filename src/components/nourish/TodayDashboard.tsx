"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { Plus, Scale, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddFoodModal } from "./AddFoodModal";
import { MacroRing } from "./MacroRing";
import { MacroFitSuggestions } from "./MacroFitSuggestions";
import { WaterTracker } from "./WaterTracker";
import { RECIPES } from "@/data/recipes";
import {
  getDiaryForDate,
  getTargets,
  getWeightLog,
  addWeightEntry,
  todayString,
  newId,
} from "@/lib/nourish/storage";
import { sumTotals, entryTotals } from "@/lib/nourish/types";
import type { DiaryEntry, MealSlot, TargetSnapshot, WeightEntry } from "@/lib/nourish/types";

const MEAL_ORDER: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};
const MEAL_EMOJI: Record<MealSlot, string> = {
  breakfast: "☀️",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
};

// ─── Calorie budget bar ───────────────────────────────────────────────────────

function CalorieBudgetHero({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const remaining = Math.max(0, target - consumed);
  const fraction = Math.min(consumed / target, 1);
  const over = consumed > target;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
      {/* Numbers */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Calories today
          </p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tabular-nums text-stone-900">
              {Math.round(consumed).toLocaleString()}
            </span>
            <span className="text-sm text-stone-400">/ {target.toLocaleString()}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={clsx("text-xl font-bold tabular-nums", over ? "text-rose-500" : "text-emerald-600")}>
            {over ? "+" : ""}{Math.abs(Math.round(over ? consumed - target : remaining)).toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-400">{over ? "over" : "remaining"}</p>
        </div>
      </div>

      {/* Budget bar */}
      <div className="h-3 overflow-hidden rounded-full bg-stone-100">
        <div
          className={clsx(
            "h-full rounded-full motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
            over ? "bg-rose-400" : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(fraction * 100, 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(consumed)}
          aria-valuemax={target}
          aria-label={`${Math.round(consumed)} of ${target} calories consumed`}
        />
      </div>
    </div>
  );
}

// ─── Quick weight log ─────────────────────────────────────────────────────────

function WeightQuickAdd({ onLogged }: { onLogged: () => void }) {
  const [open, setOpen] = useState(false);
  const [kg, setKg] = useState("");
  const [done, setDone] = useState(false);

  function handleLog() {
    const v = parseFloat(kg);
    if (!isNaN(v) && v > 20 && v < 500) {
      const entry: WeightEntry = { id: newId(), date: todayString(), weightKg: v };
      addWeightEntry(entry);
      setDone(true);
      onLogged();
      setTimeout(() => { setOpen(false); setDone(false); setKg(""); }, 1200);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 hover:border-emerald-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Scale size={15} className="text-stone-400" />
        Log weight
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2">
      <Scale size={15} className="shrink-0 text-emerald-600" />
      <input
        type="number"
        min={20}
        max={500}
        step={0.1}
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleLog(); if (e.key === "Escape") setOpen(false); }}
        placeholder="kg"
        autoFocus
        className="w-20 bg-transparent text-sm font-medium text-stone-900 focus:outline-none"
      />
      {done ? (
        <span className="text-xs text-emerald-700">✓ Saved</span>
      ) : (
        <>
          <Button variant="primary" size="sm" onClick={handleLog}>Save</Button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
        </>
      )}
    </div>
  );
}

// ─── Meal quick-view ──────────────────────────────────────────────────────────

function MealQuickRow({
  meal,
  entries,
  onAdd,
}: {
  meal: MealSlot;
  entries: DiaryEntry[];
  onAdd: () => void;
}) {
  const kcal = entries.reduce((s, e) => s + entryTotals(e).kcal, 0);

  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden>{MEAL_EMOJI[meal]}</span>
        <div>
          <p className="text-xs font-semibold text-stone-800">{MEAL_LABELS[meal]}</p>
          {entries.length > 0 ? (
            <p className="text-[10px] text-stone-400">{entries.length} item{entries.length !== 1 ? "s" : ""} · {Math.round(kcal)} kcal</p>
          ) : (
            <p className="text-[10px] text-stone-400">Nothing logged</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add food to ${MEAL_LABELS[meal]}`}
        className="grid h-7 w-7 place-items-center rounded-full border border-stone-200 text-stone-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  onSwitchToDiary: () => void;
}

export function TodayDashboard({ onSwitchToDiary }: Props) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [targets, setTargets] = useState<TargetSnapshot | null>(null);
  const [addMeal, setAddMeal] = useState<MealSlot | null>(null);
  const [todayWeight, setTodayWeight] = useState<WeightEntry | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const today = todayString();

  const load = useCallback(() => {
    const diaryEntries = getDiaryForDate(today);
    const t = getTargets();
    const wl = getWeightLog();
    const todayW = wl.find((w) => w.date === today) ?? null;

    setEntries(diaryEntries);
    setTargets(t);
    setTodayWeight(todayW);
  }, [today]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
    setHydrated(true);
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hydrated) return null;

  if (!targets) {
    return (
      <EmptyState
        emoji="⚙️"
        title="Set up your profile first"
        description="Head to the Profile tab to enter your stats and get your calorie and macro targets."
        tone="emerald"
      />
    );
  }

  const totals = sumTotals(entries);
  const byMeal = MEAL_ORDER.reduce<Record<MealSlot, DiaryEntry[]>>((acc, m) => {
    acc[m] = entries.filter((e) => e.meal === m);
    return acc;
  }, {} as Record<MealSlot, DiaryEntry[]>);

  return (
    <div className="space-y-4">
      {/* Calorie hero */}
      <CalorieBudgetHero consumed={totals.kcal} target={targets.calorieTarget} />

      {/* Macro rings */}
      <div className="flex justify-around rounded-2xl border border-stone-200 bg-white px-4 py-5 shadow-sm">
        <MacroRing
          fraction={totals.proteinG / targets.proteinG}
          consumed={totals.proteinG}
          target={targets.proteinG}
          label="Protein"
          colorClass="stroke-emerald-500"
          trackClass="stroke-emerald-100"
        />
        <MacroRing
          fraction={totals.carbG / targets.carbG}
          consumed={totals.carbG}
          target={targets.carbG}
          label="Carbs"
          colorClass="stroke-amber-400"
          trackClass="stroke-amber-100"
        />
        <MacroRing
          fraction={totals.fatG / targets.fatG}
          consumed={totals.fatG}
          target={targets.fatG}
          label="Fat"
          colorClass="stroke-violet-400"
          trackClass="stroke-violet-100"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setAddMeal("snack")}
        >
          Add food
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<BookOpen size={14} />}
          onClick={onSwitchToDiary}
        >
          Full diary
        </Button>
        <WeightQuickAdd onLogged={load} />
      </div>

      {/* Today's weight */}
      {todayWeight && (
        <p className="text-xs text-stone-500 text-center">
          Today&apos;s weight: <strong className="text-stone-700">{todayWeight.weightKg} kg</strong>
        </p>
      )}

      {/* Meal summary */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-700">Today&apos;s meals</h3>
        {MEAL_ORDER.map((meal) => (
          <MealQuickRow
            key={meal}
            meal={meal}
            entries={byMeal[meal]}
            onAdd={() => setAddMeal(meal)}
          />
        ))}
      </div>

      {/* Water tracking */}
      <WaterTracker />

      {/* Macro-fit recipe suggestions */}
      <MacroFitSuggestions
        recipes={RECIPES}
        targets={targets}
        consumed={totals}
      />

      {/* Add food modal */}
      {addMeal && (
        <AddFoodModal
          defaultMeal={addMeal}
          onClose={() => setAddMeal(null)}
          onLogged={load}
        />
      )}
    </div>
  );
}
