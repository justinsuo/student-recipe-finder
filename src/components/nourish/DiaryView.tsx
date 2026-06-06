"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddFoodModal } from "./AddFoodModal";
import {
  getDiaryForDate,
  updateDiaryEntry,
  deleteDiaryEntry,
  addDiaryEntry,
  todayString,
  dateToLocalString,
  newId,
  pushRecentFood,
} from "@/lib/nourish/storage";
import { entryTotals, sumTotals } from "@/lib/nourish/types";
import type { DiaryEntry, MealSlot, DayTotals } from "@/lib/nourish/types";

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

// ─── Date navigator ───────────────────────────────────────────────────────────

function dateOffset(base: string, delta: number): string {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return dateToLocalString(d);
}

function formatDate(iso: string): string {
  const today = todayString();
  const yesterday = dateOffset(today, -1);
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Inline edit row ──────────────────────────────────────────────────────────

function EntryRow({
  entry,
  onDelete,
  onChange,
}: {
  entry: DiaryEntry;
  onDelete: () => void;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(entry.quantityServings);
  const [loggedAgain, setLoggedAgain] = useState(false);
  const loggedAgainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (loggedAgainTimeoutRef.current) clearTimeout(loggedAgainTimeoutRef.current);
    };
  }, []);
  const totals = entryTotals({ ...entry, quantityServings: qty });

  function handleSave() {
    updateDiaryEntry({ ...entry, quantityServings: qty });
    setEditing(false);
    onChange();
  }

  function handleLogAgain() {
    pushRecentFood(entry.food);
    addDiaryEntry({
      id: newId(),
      date: todayString(),
      meal: entry.meal,
      food: entry.food,
      quantityServings: entry.quantityServings,
      snapshotKcal: entry.food.kcal,
      snapshotProteinG: entry.food.proteinG,
      snapshotCarbG: entry.food.carbG,
      snapshotFatG: entry.food.fatG,
      loggedAt: new Date().toISOString(),
    });
    setLoggedAgain(true);
    if (loggedAgainTimeoutRef.current) clearTimeout(loggedAgainTimeoutRef.current);
    loggedAgainTimeoutRef.current = setTimeout(() => {
      setLoggedAgain(false);
      onChange();
    }, 900);
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-stone-900">{entry.food.name}</p>
        <p className="text-[11px] text-stone-400">
          {editing ? (
            <span className="flex items-center gap-1.5">
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value) || 0.25)}
                className="w-16 rounded border border-stone-300 px-1.5 py-0.5 text-xs"
                autoFocus
              />
              × {entry.food.servingDescription}
            </span>
          ) : (
            `${entry.quantityServings} × ${entry.food.servingDescription}`
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="text-right mr-1">
          <p className="text-sm font-semibold tabular-nums text-stone-800">{Math.round(totals.kcal)} kcal</p>
          <p className="text-[10px] text-stone-400">
            {totals.proteinG.toFixed(1)}P · {totals.carbG.toFixed(1)}C · {totals.fatG.toFixed(1)}F
          </p>
        </div>

        {/* Log again — re-logs this entry to today */}
        <button
          type="button"
          onClick={handleLogAgain}
          aria-label="Log again today"
          title="Log again today"
          className={clsx(
            "grid h-7 w-7 place-items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            loggedAgain
              ? "bg-emerald-100 text-emerald-600"
              : "text-stone-400 hover:bg-stone-100",
          )}
        >
          {loggedAgain ? <Check size={13} /> : <RotateCcw size={13} />}
        </button>

        {editing ? (
          <button
            type="button"
            onClick={handleSave}
            aria-label="Save"
            className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Check size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit serving"
            className="grid h-7 w-7 place-items-center rounded-full text-stone-400 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Pencil size={13} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete entry"
          className="grid h-7 w-7 place-items-center rounded-full text-stone-400 hover:bg-rose-50 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Meal section ─────────────────────────────────────────────────────────────

function MealSection({
  meal,
  entries,
  onAdd,
  onDelete,
  onChange,
}: {
  meal: MealSlot;
  entries: DiaryEntry[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onChange: () => void;
}) {
  const totals: DayTotals =
    entries.length > 0
      ? sumTotals(entries)
      : { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
          <span aria-hidden>{MEAL_EMOJI[meal]}</span>
          {MEAL_LABELS[meal]}
          {entries.length > 0 && (
            <span className="ml-1 text-xs font-normal text-stone-400 tabular-nums">
              {Math.round(totals.kcal)} kcal
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add food to ${MEAL_LABELS[meal]}`}
          className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Plus size={11} />
          Add
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 py-3 text-center text-xs text-stone-400">
          Nothing logged yet
        </p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
              onDelete={() => onDelete(e.id)}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Day totals bar ───────────────────────────────────────────────────────────

function DayTotalsBar({ totals }: { totals: DayTotals }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex-1 text-center">
        <p className="text-lg font-bold tabular-nums text-stone-900">{Math.round(totals.kcal)}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">kcal</p>
      </div>
      <div className="w-px bg-stone-100" />
      <div className="flex-1 text-center">
        <p className="text-lg font-bold tabular-nums text-emerald-600">{totals.proteinG.toFixed(0)}g</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">protein</p>
      </div>
      <div className="w-px bg-stone-100" />
      <div className="flex-1 text-center">
        <p className="text-lg font-bold tabular-nums text-amber-500">{totals.carbG.toFixed(0)}g</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">carbs</p>
      </div>
      <div className="w-px bg-stone-100" />
      <div className="flex-1 text-center">
        <p className="text-lg font-bold tabular-nums text-violet-500">{totals.fatG.toFixed(0)}g</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">fat</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DiaryView() {
  const [date, setDate] = useState(todayString());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [addMeal, setAddMeal] = useState<MealSlot | null>(null);

  const today = todayString();
  const isToday = date === today;

  const load = useCallback(() => {
    setEntries(getDiaryForDate(date));
  }, [date]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleDelete(id: string) {
    deleteDiaryEntry(id);
    load();
  }

  const totals = sumTotals(entries);

  const byMeal = MEAL_ORDER.reduce<Record<MealSlot, DiaryEntry[]>>((acc, m) => {
    acc[m] = entries.filter((e) => e.meal === m);
    return acc;
  }, {} as Record<MealSlot, DiaryEntry[]>);

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => setDate((d) => dateOffset(d, -1))}
          aria-label="Previous day"
          className={clsx(
            "grid h-8 w-8 place-items-center rounded-full text-stone-600 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          )}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-stone-900">{formatDate(date)}</p>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="text-[10px] text-emerald-600 hover:underline focus:outline-none"
            >
              Go to today
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDate((d) => dateOffset(d, 1))}
          disabled={isToday}
          aria-label="Next day"
          className="grid h-8 w-8 place-items-center rounded-full text-stone-600 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day totals */}
      {entries.length > 0 && <DayTotalsBar totals={totals} />}

      {/* Meal sections */}
      {entries.length === 0 && (
        <EmptyState
          emoji="📖"
          title="Nothing logged yet"
          description={`Tap "Add" next to a meal to log food for ${formatDate(date)}.`}
          tone="emerald"
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddMeal("breakfast")}>
              Log something
            </Button>
          }
        />
      )}

      <div className="space-y-5">
        {MEAL_ORDER.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            entries={byMeal[meal]}
            onAdd={() => setAddMeal(meal)}
            onDelete={handleDelete}
            onChange={load}
          />
        ))}
      </div>

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
