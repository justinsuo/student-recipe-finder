"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Plus, Trash2, ArrowRight, Save } from "lucide-react";
import { NourishShell } from "@/components/nourish/NourishShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getMeals,
  saveMeal,
  deleteMeal,
  mealToDiaryEntries,
  entriesToMeal,
  type NourishMeal,
} from "@/lib/nourish/meals";
import {
  addDiaryEntry,
  getDiaryForDate,
  newId,
  todayString,
} from "@/lib/nourish/storage";
import type { MealSlot } from "@/lib/nourish/types";

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export default function NourishMealsPage() {
  const toast = useToast();
  const [meals, setMeals] = useState<NourishMeal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [picking, setPicking] = useState<MealSlot | null>(null);
  const [pickName, setPickName] = useState("");

  function refresh() {
    setMeals(getMeals());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    setHydrated(true);
  }, []);

  function saveFromDiary(slot: MealSlot) {
    const today = todayString();
    const entries = getDiaryForDate(today).filter((e) => e.meal === slot);
    if (entries.length === 0) {
      toast.info(
        `No ${slot} logged today — log a few foods first, then come back.`,
      );
      return;
    }
    const name = pickName.trim() || `My ${slot}`;
    const meal = entriesToMeal(
      entries,
      name,
      undefined,
      newId,
      new Date().toISOString(),
    );
    saveMeal(meal);
    setPicking(null);
    setPickName("");
    refresh();
    toast.success(`Meal saved — ${entries.length} items grouped as "${name}".`);
  }

  function logMealToToday(meal: NourishMeal) {
    const slot: MealSlot = meal.defaultSlot ?? "lunch";
    const entries = mealToDiaryEntries(meal, todayString(), slot, newId);
    for (const e of entries) addDiaryEntry(e);
    toast.reward(`Logged — ${entries.length} items added to today's ${slot}.`);
  }

  function remove(meal: NourishMeal) {
    deleteMeal(meal.id);
    refresh();
    toast.info(`Removed "${meal.name}".`);
  }

  return (
    <NourishShell
      title="My meals."
      description="Reusable groups of foods you eat together. Save your usual breakfast once, log it in one tap from then on."
    >
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Save size={11} /> Save today&apos;s meal
            </span>
          }
          title="Group what you ate."
          description="Pick a slot. We'll bundle the foods you logged for it today into a reusable meal."
          tone="amber"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SLOTS.map(({ value, label }) => {
            const active = picking === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPicking(active ? null : value);
                  setPickName("");
                }}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4 text-left shadow-sm shadow-emerald-200"
                    : "rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50/50"
                }
              >
                <p className="text-sm font-semibold text-stone-900">{label}</p>
                <p className="mt-0.5 text-xs text-stone-500">Save today&apos;s {label.toLowerCase()}</p>
              </button>
            );
          })}
        </div>

        {picking && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Meal name
              </span>
              <input
                type="text"
                value={pickName}
                onChange={(e) => setPickName(e.target.value)}
                placeholder={`My ${picking}`}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => saveFromDiary(picking)} leftIcon={<Save size={14} />}>
                Save as &ldquo;{pickName.trim() || `My ${picking}`}&rdquo;
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPicking(null);
                  setPickName("");
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-emerald-800">
              We&apos;ll bundle the foods you&apos;ve logged to today&apos;s{" "}
              {picking}. Log some first if you haven&apos;t.
            </p>
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Layers size={11} /> Saved
            </span>
          }
          title={`${meals.length} meal${meals.length === 1 ? "" : "s"}`}
          description="Tap a meal to log all its foods to today's diary."
          tone="violet"
        />
        {hydrated && meals.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              emoji="🥗"
              title="No saved meals yet"
              description="Save your usual breakfast, your go-to lunch, or your post-gym snack — then log them in one tap."
              tone="emerald"
              action={
                <Link
                  href="/nourish/diary"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
                >
                  Go to diary
                  <ArrowRight size={14} />
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {meals.map((meal) => (
              <li
                key={meal.id}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {meal.name}
                    </p>
                    {meal.defaultSlot && (
                      <p className="text-[11px] uppercase tracking-wide text-stone-500">
                        Usually {meal.defaultSlot}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(meal)}
                    className="text-stone-400 transition-colors hover:text-red-600"
                    aria-label={`Delete ${meal.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                    {Math.round(meal.totalKcal)} kcal
                  </span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">
                    {Math.round(meal.totalProteinG)} g protein
                  </span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">
                    {Math.round(meal.totalCarbG)} g carbs
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    {Math.round(meal.totalFatG)} g fat
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  {meal.items.length} items
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={14} />}
                  onClick={() => logMealToToday(meal)}
                >
                  Log to today
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </NourishShell>
  );
}
