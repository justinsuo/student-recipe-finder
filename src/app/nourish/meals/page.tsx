"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Trash2,
  ArrowRight,
  Save,
  CalendarDays,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
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

const DAYS_AHEAD = 7;

// Build the next 7 days starting from `today`. Each entry has the YYYY-MM-DD
// key + a short label ("Today", "Tomorrow", "Wed 11").
function buildDayPickerOptions(today: string): {
  date: string;
  label: string;
}[] {
  const out: { date: string; label: string }[] = [];
  const base = new Date(today + "T00:00:00");
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
  });
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : fmt.format(d);
    out.push({ date: key, label });
  }
  return out;
}

export default function NourishMealsPage() {
  const toast = useToast();
  const [meals, setMeals] = useState<NourishMeal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [savePicking, setSavePicking] = useState<MealSlot | null>(null);
  const [pickName, setPickName] = useState("");
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [pickedDays, setPickedDays] = useState<Set<string>>(new Set());
  const [pickedSlot, setPickedSlot] = useState<MealSlot>("lunch");

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
    setSavePicking(null);
    setPickName("");
    refresh();
    toast.success(`Meal saved — ${entries.length} items grouped as "${name}".`);
  }

  function openScheduler(meal: NourishMeal) {
    setScheduling(meal.id);
    // Default to today only + the meal's preferred slot.
    setPickedDays(new Set([todayString()]));
    setPickedSlot(meal.defaultSlot ?? "lunch");
  }

  function toggleDay(date: string) {
    const next = new Set(pickedDays);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setPickedDays(next);
  }

  function commitSchedule(meal: NourishMeal) {
    if (pickedDays.size === 0) {
      toast.info("Pick at least one day.");
      return;
    }
    let totalEntries = 0;
    for (const day of pickedDays) {
      const entries = mealToDiaryEntries(meal, day, pickedSlot, newId);
      for (const e of entries) addDiaryEntry(e);
      totalEntries += entries.length;
    }
    const days = pickedDays.size;
    setScheduling(null);
    setPickedDays(new Set());
    toast.reward(
      `Logged ${totalEntries} item${totalEntries === 1 ? "" : "s"} to ${days} day${days === 1 ? "" : "s"} of ${pickedSlot}.`,
    );
  }

  function remove(meal: NourishMeal) {
    deleteMeal(meal.id);
    refresh();
    toast.info(`Removed "${meal.name}".`);
  }

  const today = todayString();
  const dayOptions = buildDayPickerOptions(today);

  return (
    <NourishShell
      title="My meals."
      description="Reusable groups of foods you eat together. Save your usual breakfast once, log it to a single day or your whole meal-prep week in one tap."
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
            const active = savePicking === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSavePicking(active ? null : value);
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
                <p className="mt-0.5 text-xs text-stone-500">
                  Save today&apos;s {label.toLowerCase()}
                </p>
              </button>
            );
          })}
        </div>

        {savePicking && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Meal name
              </span>
              <input
                type="text"
                value={pickName}
                onChange={(e) => setPickName(e.target.value)}
                placeholder={`My ${savePicking}`}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => saveFromDiary(savePicking)}
                leftIcon={<Save size={14} />}
              >
                Save as &ldquo;{pickName.trim() || `My ${savePicking}`}&rdquo;
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSavePicking(null);
                  setPickName("");
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-emerald-800">
              We&apos;ll bundle the foods you&apos;ve logged to today&apos;s{" "}
              {savePicking}. Log some first if you haven&apos;t.
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
          description="Log a meal to today, or schedule it across multiple days for meal prep."
          tone="violet"
        />
        {hydrated && meals.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              emoji="🥗"
              title="No saved meals yet"
              description="Save your usual breakfast, your go-to lunch, or your post-gym snack — then log them in one tap, today or all week."
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

                {scheduling === meal.id ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                      Pick days
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {dayOptions.map((d) => {
                        const active = pickedDays.has(d.date);
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => toggleDay(d.date)}
                            aria-pressed={active}
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                              active
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-200 motion-safe:scale-[1.04]"
                                : "border-stone-200 bg-white text-stone-700 hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50",
                            )}
                          >
                            {active && <Check size={10} />}
                            {d.label}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                      Slot
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {SLOTS.map(({ value, label }) => {
                        const active = pickedSlot === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setPickedSlot(value)}
                            aria-pressed={active}
                            className={
                              active
                                ? "rounded-full border border-emerald-600 bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-emerald-200"
                                : "rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                            }
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => commitSchedule(meal)}
                        disabled={pickedDays.size === 0}
                        leftIcon={<Plus size={14} />}
                      >
                        Log to {pickedDays.size}{" "}
                        {pickedDays.size === 1 ? "day" : "days"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setScheduling(null);
                          setPickedDays(new Set());
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus size={14} />}
                      onClick={() => {
                        const slot: MealSlot = meal.defaultSlot ?? "lunch";
                        const entries = mealToDiaryEntries(
                          meal,
                          todayString(),
                          slot,
                          newId,
                        );
                        for (const e of entries) addDiaryEntry(e);
                        toast.reward(
                          `Logged — ${entries.length} items added to today's ${slot}.`,
                        );
                      }}
                    >
                      Log to today
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<CalendarDays size={14} />}
                      onClick={() => openScheduler(meal)}
                    >
                      Log to multiple days
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-stone-500">
        Nutrition estimates are for general tracking only and may vary by
        brand, portion, and preparation. Not medical advice.
      </p>
    </NourishShell>
  );
}
