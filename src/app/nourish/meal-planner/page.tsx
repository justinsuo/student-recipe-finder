"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  X,
  Search,
  ShoppingBasket,
  Send,
  Soup,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import { NourishShell } from "@/components/nourish/NourishShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAppStore } from "@/lib/AppStore";
import { RECIPES, RECIPE_MAP } from "@/data/recipes";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { calculateMissingIngredients, pantrySetFromItems } from "@/lib/recipeScoring";
import {
  getPlan,
  getPlanForDate,
  upsertPlanItem,
  removePlanItem,
  nextSevenDays,
  type PlanItem,
} from "@/lib/nourish/mealPlan";
import {
  addDiaryEntry,
  newId,
  todayString,
} from "@/lib/nourish/storage";
import { getMeals, mealToDiaryEntries } from "@/lib/nourish/meals";
import type { MealSlot } from "@/lib/nourish/types";

const SLOTS: { value: MealSlot; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Breakfast", emoji: "☀️" },
  { value: "lunch", label: "Lunch", emoji: "🥗" },
  { value: "dinner", label: "Dinner", emoji: "🍽️" },
  { value: "snack", label: "Snacks", emoji: "🍎" },
];

function dayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * 7-day meal plan grid. Each slot (breakfast/lunch/dinner/snacks) can hold
 * a database recipe or a saved meal. "Log day" pushes a single date's
 * plan to the diary; "Send to grocery" surfaces missing ingredients for
 * the whole week. Pantry-aware — already-pantry ingredients aren't
 * double-bought.
 */
export default function NourishMealPlannerPage() {
  const today = todayString();
  const days = nextSevenDays(today);
  const toast = useToast();
  const { pantry, addGroceryItems } = useAppStore();
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [picking, setPicking] = useState<{ date: string; slot: MealSlot } | null>(
    null,
  );

  function refresh() {
    setPlan(getPlan());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  function cellFor(date: string, slot: MealSlot): PlanItem | undefined {
    return plan.find((p) => p.date === date && p.slot === slot);
  }

  function logDay(date: string) {
    const items = getPlanForDate(date);
    if (items.length === 0) {
      toast.info("Nothing planned for that day yet.");
      return;
    }
    let logged = 0;
    const meals = getMeals();
    for (const item of items) {
      if (item.kind === "recipe") {
        const r = RECIPE_MAP.get(item.refId);
        if (!r) continue;
        const n = bestEffortNutrition(r).estimate;
        const food = {
          id: `plan-recipe-${r.id}`,
          source: "recipe" as const,
          externalId: r.id,
          name: r.name,
          servingDescription: "1 serving",
          kcal: n.calories,
          proteinG: n.protein,
          carbG: n.carbs,
          fatG: n.fat,
          fiberG: n.fiber,
        };
        addDiaryEntry({
          id: newId(),
          date,
          meal: item.slot,
          food,
          quantityServings: 1,
          snapshotKcal: food.kcal,
          snapshotProteinG: food.proteinG,
          snapshotCarbG: food.carbG,
          snapshotFatG: food.fatG,
          loggedAt: new Date().toISOString(),
        });
        logged += 1;
      } else {
        const m = meals.find((x) => x.id === item.refId);
        if (!m) continue;
        const entries = mealToDiaryEntries(m, date, item.slot, newId);
        for (const e of entries) addDiaryEntry(e);
        logged += entries.length;
      }
    }
    toast.reward(
      `Logged ${logged} item${logged === 1 ? "" : "s"} to ${dayLabel(date, today)}.`,
    );
  }

  function sendWeekToGrocery() {
    const pantrySet = pantrySetFromItems(pantry);
    const seen = new Set<string>();
    let added = 0;
    for (const item of plan) {
      if (item.kind !== "recipe") continue;
      const r = RECIPE_MAP.get(item.refId);
      if (!r) continue;
      const missing = calculateMissingIngredients(r, pantrySet);
      const fresh = missing.filter((m) => {
        if (seen.has(m.ingredientId)) return false;
        seen.add(m.ingredientId);
        return true;
      });
      if (fresh.length === 0) continue;
      addGroceryItems(
        r,
        fresh.map((f) => f.ingredientId),
      );
      added += fresh.length;
    }
    if (added === 0) {
      toast.info("Pantry already covers every planned recipe.");
    } else {
      toast.reward(
        `Added ${added} ingredient${added === 1 ? "" : "s"} to your grocery list.`,
      );
    }
  }

  return (
    <NourishShell
      title="Meal planner."
      description="Plan the next 7 days. Tap a slot, pick a recipe or saved meal, then log the day in one tap when it arrives."
    >
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={11} /> Next 7 days
              </span>
            }
            title="Plan your week."
            description="Pantry-aware: the grocery roll-up skips anything you already have."
            tone="violet"
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            leftIcon={<ShoppingBasket size={14} />}
            onClick={sendWeekToGrocery}
          >
            Send week to grocery
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {days.map((date) => (
            <div
              key={date}
              className="rounded-2xl border border-stone-200 bg-stone-50/40 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                  {dayLabel(date, today)}
                </p>
                <button
                  type="button"
                  onClick={() => logDay(date)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700"
                >
                  <Send size={10} /> Log day
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {SLOTS.map(({ value, label, emoji }) => {
                  const cell = cellFor(date, value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPicking({ date, slot: value })}
                      className={clsx(
                        "group flex min-h-[88px] flex-col gap-1.5 rounded-xl border p-3 text-left transition-all",
                        cell
                          ? "border-emerald-300 bg-white shadow-sm hover:border-emerald-400"
                          : "border-dashed border-stone-300 bg-white/60 hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50/50",
                      )}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                        <span className="mr-1">{emoji}</span>
                        {label}
                      </p>
                      {cell ? (
                        <>
                          <p className="line-clamp-2 text-sm font-semibold text-stone-900">
                            {cell.name}
                          </p>
                          <div className="mt-auto flex items-center justify-between gap-2 text-[10px] text-stone-500">
                            <span>
                              {Math.round(cell.kcal ?? 0)} kcal ·{" "}
                              {Math.round(cell.proteinG ?? 0)} g P
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label="Remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePlanItem(date, value);
                                refresh();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removePlanItem(date, value);
                                  refresh();
                                }
                              }}
                              className="grid h-5 w-5 cursor-pointer place-items-center rounded-full text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <X size={10} />
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 group-hover:text-emerald-700">
                          <Plus size={11} />
                          Plan {label.toLowerCase()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {picking && (
        <PickerSheet
          date={picking.date}
          slot={picking.slot}
          onClose={() => setPicking(null)}
          onPicked={() => {
            setPicking(null);
            refresh();
          }}
        />
      )}

      <p className="text-[11px] text-stone-500">
        Plans live in your browser. Nothing is uploaded.
      </p>
    </NourishShell>
  );
}

// ─── Picker sheet ────────────────────────────────────────────────────────

function PickerSheet({
  date,
  slot,
  onClose,
  onPicked,
}: {
  date: string;
  slot: MealSlot;
  onClose: () => void;
  onPicked: () => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<"recipe" | "meal">("recipe");
  const [query, setQuery] = useState("");
  const PAGE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE);

  // Reset pagination whenever the query changes — otherwise users
  // hitting "Load more" on a 200-item query and then changing query
  // would still render 200 rows.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE);
  }, [query]);

  const meals = useMemo(() => getMeals(), []);
  const allRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RECIPES.filter((r) => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }).map((r) => ({ r, n: bestEffortNutrition(r).estimate }));
  }, [query]);
  const recipes = useMemo(
    () => allRecipes.slice(0, visibleCount),
    [allRecipes, visibleCount],
  );
  const totalMatches = allRecipes.length;

  function pickRecipe(recipeId: string, name: string, kcal: number, proteinG: number) {
    upsertPlanItem({
      date,
      slot,
      kind: "recipe",
      refId: recipeId,
      name,
      kcal,
      proteinG,
    });
    toast.success(`Added ${name} to ${slot}.`);
    onPicked();
  }

  function pickMeal(mealId: string) {
    const m = meals.find((x) => x.id === mealId);
    if (!m) return;
    upsertPlanItem({
      date,
      slot,
      kind: "meal",
      refId: m.id,
      name: m.name,
      kcal: m.totalKcal,
      proteinG: m.totalProteinG,
    });
    toast.success(`Added ${m.name} to ${slot}.`);
    onPicked();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl motion-safe:animate-[fadeUp_240ms_ease-out] sm:max-w-xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700">
              Plan
            </p>
            <p className="text-sm font-semibold text-stone-900">
              Pick a {slot} for {date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("recipe")}
              aria-pressed={tab === "recipe"}
              className={
                tab === "recipe"
                  ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200"
                  : "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
              }
            >
              <Soup size={12} />
              Recipes
            </button>
            <button
              type="button"
              onClick={() => setTab("meal")}
              aria-pressed={tab === "meal"}
              className={
                tab === "meal"
                  ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200"
                  : "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
              }
            >
              <Layers size={12} />
              My meals
            </button>
          </div>

          {tab === "recipe" && (
            <>
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search recipes…"
                  className="w-full rounded-full border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              {totalMatches > 0 && (
                <p className="text-[11px] text-stone-500" aria-live="polite">
                  Showing{" "}
                  <span className="font-semibold text-stone-700">
                    {Math.min(visibleCount, totalMatches)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-stone-700">
                    {totalMatches}
                  </span>{" "}
                  recipe{totalMatches === 1 ? "" : "s"}
                </p>
              )}
              {totalMatches === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-600">
                  No recipes match{" "}
                  <span className="font-semibold text-stone-800">
                    &ldquo;{query.trim()}&rdquo;
                  </span>
                  . Try a shorter search.
                </div>
              ) : (
                <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                  {recipes.map(({ r, n }) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() =>
                          pickRecipe(r.id, r.name, n.calories, n.protein)
                        }
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-2.5 text-left transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50/50"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">
                          {r.name}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-stone-600">
                          {Math.round(n.calories)} kcal ·{" "}
                          {Math.round(n.protein)} g P
                        </span>
                      </button>
                    </li>
                  ))}
                  {visibleCount < totalMatches && (
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCount((c) => Math.min(c + PAGE, totalMatches))
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs font-semibold text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        Load{" "}
                        {Math.min(PAGE, totalMatches - visibleCount)} more
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </>
          )}

          {tab === "meal" &&
            (meals.length === 0 ? (
              <EmptyState
                emoji="🥗"
                title="No saved meals yet"
                description="Save a meal from your diary first, then it'll show up here for planning."
                tone="emerald"
                action={
                  <Link
                    href="/nourish/meals"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
                  >
                    Go to meals
                  </Link>
                }
              />
            ) : (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                {meals.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => pickMeal(m.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-2.5 text-left transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">
                        {m.name}
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-stone-600">
                        {Math.round(m.totalKcal)} kcal ·{" "}
                        {Math.round(m.totalProteinG)} g P
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>
    </div>
  );
}
