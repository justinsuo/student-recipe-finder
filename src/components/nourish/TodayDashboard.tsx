"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  Plus,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddFoodModal } from "./AddFoodModal";
import { WaterTracker } from "./WaterTracker";
import { PhotoMealLogger } from "./PhotoMealLogger";
import { CalorieProgressRing } from "./CalorieProgressRing";
import { MacroCard } from "./MacroCard";
import { QuickLogActions } from "./QuickLogActions";
import { ExerciseLogger } from "./ExerciseLogger";
import { QuickAddMacrosModal } from "./QuickAddMacrosModal";
import { useToast } from "@/components/ui/Toast";
import {
  getDiaryForDate,
  getTargets,
  todayString,
  deleteDiaryEntry,
} from "@/lib/nourish/storage";
import {
  getExerciseForDate,
  sumExerciseCalories,
  type ExerciseEntry,
} from "@/lib/nourish/exercise";
import { sumTotals, entryTotals } from "@/lib/nourish/types";
import type {
  DiaryEntry,
  MealSlot,
  TargetSnapshot,
} from "@/lib/nourish/types";

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

interface Props {
  onSwitchToDiary: () => void;
}

/**
 * Today's Nourish dashboard.
 *
 * Composition (top-down):
 *   1. Date strip + Goals link
 *   2. Hero card — CalorieProgressRing + remaining + exercise-burned
 *   3. 3-up macro cards (protein / carbs / fat)
 *   4. Quick action row (Log food / Voice / Scan / Receipt / Quick add /
 *      Water / Exercise)
 *   5. Meal diary preview (4 slots, each with entries + add button +
 *      per-meal totals)
 *   6. Water + photo-meal-logger
 *
 * All the data hooks (entries, targets, exercise) come from the existing
 * Nourish storage layer so the rewrite doesn't regress functionality. The
 * Insights + Fasting panels live outside (in the page) so this stays
 * single-purpose.
 */
export function TodayDashboard({ onSwitchToDiary }: Props) {
  const toast = useToast();
  const today = todayString();
  const [date, setDate] = useState<string>(today);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [targets, setTargets] = useState<TargetSnapshot | null>(null);
  const [exercise, setExercise] = useState<ExerciseEntry[]>([]);
  const [addMeal, setAddMeal] = useState<MealSlot | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const waterRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setEntries(getDiaryForDate(date));
    setTargets(getTargets());
    setExercise(getExerciseForDate(date));
  }, [date]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
    setHydrated(true);
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-stone-100" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          <div className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          <div className="h-28 animate-pulse rounded-2xl bg-stone-100" />
        </div>
      </div>
    );
  }

  if (!targets) {
    return (
      <EmptyState
        emoji="⚙️"
        title="Set up your profile first"
        description="Head to Settings to enter your stats — we'll personalize your calorie and macro targets."
        tone="emerald"
        action={
          <Link
            href="/nourish/settings"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
          >
            <Target size={14} />
            Open Settings
          </Link>
        }
      />
    );
  }

  const totals = sumTotals(entries);
  const byMeal = MEAL_ORDER.reduce<Record<MealSlot, DiaryEntry[]>>((acc, m) => {
    acc[m] = entries.filter((e) => e.meal === m);
    return acc;
  }, {} as Record<MealSlot, DiaryEntry[]>);
  const exerciseKcal = sumExerciseCalories(exercise);

  function stepDate(deltaDays: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + deltaDays);
    setDate(d.toISOString().slice(0, 10));
  }

  function deleteEntry(entry: DiaryEntry) {
    deleteDiaryEntry(entry.id);
    load();
    toast.info(`Removed ${entry.food.name}`);
  }

  const dateLabel =
    date === today
      ? "Today"
      : new Date(date + "T00:00:00").toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

  return (
    <div className="space-y-5">
      {/* ─── Date strip + Goals link ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => stepDate(-1)}
            aria-label="Previous day"
            className="grid h-8 w-8 place-items-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDate(today)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              date === today
                ? "bg-stone-900 text-white"
                : "text-stone-700 hover:bg-stone-100",
            )}
          >
            <CalendarDays size={12} />
            {dateLabel}
          </button>
          <button
            type="button"
            onClick={() => stepDate(1)}
            aria-label="Next day"
            disabled={date >= today}
            className="grid h-8 w-8 place-items-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <Link
          href="/nourish/goals"
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition-all hover:-translate-y-px hover:border-emerald-300 hover:text-emerald-700"
        >
          <Target size={12} />
          Goals
        </Link>
      </div>

      {/* ─── Hero: calorie ring ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 p-5 shadow-sm sm:p-6">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_60%)]"
        />
        <div className="relative">
          <CalorieProgressRing
            consumed={totals.kcal}
            target={targets.calorieTarget}
            exerciseKcal={exerciseKcal}
          />
        </div>
      </section>

      {/* ─── Macro cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MacroCard
          label="Protein"
          tone="protein"
          consumed={totals.proteinG}
          target={targets.proteinG}
        />
        <MacroCard
          label="Carbs"
          tone="carbs"
          consumed={totals.carbG}
          target={targets.carbG}
        />
        <MacroCard
          label="Fat"
          tone="fat"
          consumed={totals.fatG}
          target={targets.fatG}
        />
      </div>

      {/* ─── Quick log actions ─────────────────────────────────────────── */}
      <QuickLogActions
        onLogFood={() => setAddMeal("snack")}
        onQuickAdd={() => setShowQuickAdd(true)}
        onAddWater={() =>
          waterRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
        onLogExercise={() => setShowExercise(true)}
      />

      {/* ─── Meal sections ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900">
            {date === today ? "Today's meals" : `${dateLabel}'s meals`}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<BookOpen size={14} />}
            onClick={onSwitchToDiary}
          >
            Full diary
          </Button>
        </div>
        <div className="space-y-3">
          {MEAL_ORDER.map((meal) => (
            <MealSection
              key={meal}
              meal={meal}
              entries={byMeal[meal]}
              onAdd={() => setAddMeal(meal)}
              onDeleteEntry={deleteEntry}
            />
          ))}
        </div>
      </section>

      {/* ─── Water + photo meal ────────────────────────────────────────── */}
      <div ref={waterRef}>
        <WaterTracker />
      </div>

      <PhotoMealLogger onLogged={load} />

      {/* ─── Modals ────────────────────────────────────────────────────── */}
      {addMeal && (
        <AddFoodModal
          defaultMeal={addMeal}
          onClose={() => setAddMeal(null)}
          onLogged={load}
        />
      )}
      {showQuickAdd && (
        <QuickAddMacrosModal
          onClose={() => setShowQuickAdd(false)}
          onLogged={load}
        />
      )}
      {showExercise && (
        <ExerciseLogger
          onClose={() => setShowExercise(false)}
          onLogged={load}
        />
      )}
    </div>
  );
}

// ─── Meal section ───────────────────────────────────────────────────────

function MealSection({
  meal,
  entries,
  onAdd,
  onDeleteEntry,
}: {
  meal: MealSlot;
  entries: DiaryEntry[];
  onAdd: () => void;
  onDeleteEntry: (e: DiaryEntry) => void;
}) {
  const totals = entries.reduce(
    (acc, e) => {
      const t = entryTotals(e);
      return {
        kcal: acc.kcal + t.kcal,
        proteinG: acc.proteinG + t.proteinG,
        carbG: acc.carbG + t.carbG,
        fatG: acc.fatG + t.fatG,
      };
    },
    { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 },
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden>
            {MEAL_EMOJI[meal]}
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {MEAL_LABELS[meal]}
            </p>
            <p className="text-[11px] text-stone-500">
              {entries.length > 0
                ? `${entries.length} item${entries.length === 1 ? "" : "s"} · ${Math.round(totals.kcal)} kcal · ${Math.round(totals.proteinG)} g P`
                : "Nothing logged"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add food to ${MEAL_LABELS[meal]}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      {entries.length > 0 && (
        <ul className="divide-y divide-stone-100 border-t border-stone-100">
          {entries.map((e) => {
            const t = entryTotals(e);
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {e.food.name}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {e.quantityServings} × {e.food.servingDescription}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-stone-900">
                    {Math.round(t.kcal)} kcal
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {Math.round(t.proteinG)}P · {Math.round(t.carbG)}C ·{" "}
                    {Math.round(t.fatG)}F
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteEntry(e)}
                  aria-label={`Remove ${e.food.name}`}
                  className="text-stone-400 transition-colors hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
