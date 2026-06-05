"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChefHat,
  Refrigerator,
  ShoppingBasket,
  ArrowRight,
  Beef,
  Plus,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  getTargets,
  getDiaryForDate,
  todayString,
} from "@/lib/nourish/storage";
import { sumTotals, type TargetSnapshot } from "@/lib/nourish/types";
import { useAppStore } from "@/lib/AppStore";
import { RECIPES } from "@/data/recipes";
import { INGREDIENT_MAP } from "@/data/ingredients";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import {
  calculateCostPerServing,
  calculatePantryMatch,
  pantrySetFromItems,
} from "@/lib/recipeScoring";

// Curated set of catalog IDs we can confidently suggest as protein
// staples. All present in src/data/ingredients.ts. Order matters — we
// stop once 4 are missing so the suggestion stays short.
const HIGH_PROTEIN_STAPLES = [
  "eggs",
  "greek-yogurt",
  "peanut-butter",
  "chicken-breast",
  "tuna",
  "tofu",
  "lentils",
  "black-beans",
  "chickpeas",
  "cottage-cheese",
  "milk",
  "oats",
  "protein-powder",
];

/**
 * "What should I cook?" insights panel. Reads your remaining macros for
 * the day and your current pantry, then ranks database recipes that bring
 * you closer without blowing past the day's calorie budget. Surfaced on
 * the Today dashboard.
 *
 * Everything here is computed locally — no network calls. Replaces the
 * earlier idea of a server-side AI helper for the MVP. The hooks into AI
 * Chef are deep links the user can act on with the same numbers.
 */
export function NourishInsights() {
  const { pantry, grocery, addStapleToGrocery } = useAppStore();
  const toast = useToast();
  const [targets, setTargets] = useState<TargetSnapshot | null>(null);
  const [consumed, setConsumed] = useState({
    kcal: 0,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargets(getTargets());
    setConsumed(sumTotals(getDiaryForDate(todayString())));
    setHydrated(true);
  }, []);

  const remaining = useMemo(() => {
    if (!targets) return null;
    return {
      kcal: Math.max(0, targets.calorieTarget - consumed.kcal),
      proteinG: Math.max(0, targets.proteinG - consumed.proteinG),
      carbG: Math.max(0, targets.carbG - consumed.carbG),
      fatG: Math.max(0, targets.fatG - consumed.fatG),
    };
  }, [targets, consumed]);

  // Rank recipes that fit the user's remaining macros for the day.
  // Scoring: protein delivered per kcal, with pantry-match bonus and a
  // penalty for going over the remaining calorie window.
  const suggestions = useMemo(() => {
    if (!remaining || remaining.kcal === 0) return [];
    const pantrySet = pantrySetFromItems(pantry);
    return RECIPES
      .map((r) => {
        const n = bestEffortNutrition(r).estimate;
        const overshoot = Math.max(0, n.calories - remaining.kcal);
        const proteinFit = Math.min(n.protein, remaining.proteinG);
        const proteinScore = proteinFit * 2;
        const calorieScore = Math.max(0, 40 - overshoot * 0.05);
        const match = calculatePantryMatch(r, pantrySet);
        const matchPct =
          match.total > 0 ? Math.round((match.matched / match.total) * 100) : 0;
        const pantryBonus = matchPct * 0.3;
        const score = proteinScore + calorieScore + pantryBonus;
        return {
          r,
          n,
          cps: calculateCostPerServing(r),
          matchPct,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [remaining, pantry]);

  if (!hydrated) {
    return (
      <div className="h-40 animate-pulse rounded-3xl bg-stone-100" />
    );
  }

  if (!targets || !remaining) {
    return (
      <section className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-200">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Insights
            </p>
            <p className="text-sm font-semibold text-stone-900">
              Set goals to unlock smart suggestions.
            </p>
            <p className="mt-1 text-xs text-stone-600">
              Once you have a calorie + macro target, this panel will rank
              recipes that fit what you have left in your day.
            </p>
            <Link
              href="/nourish/goals"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
            >
              Set goals
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const aiChefQuery = new URLSearchParams({
    usePantry: "true",
    targetCal: String(Math.round(remaining.kcal)),
    targetProtein: String(Math.round(remaining.proteinG)),
  }).toString();

  // Missing high-protein staples — only show if the user is genuinely
  // short on protein for the day (>30g remaining) AND at least 3 of the
  // staples are absent from pantry + grocery list. Caps at 4 suggestions.
  const pantryIds = new Set(pantry.map((p) => p.ingredientId));
  const groceryIds = new Set(grocery.map((g) => g.ingredientId));
  const missingProteinStaples = HIGH_PROTEIN_STAPLES
    .filter((id) => INGREDIENT_MAP.has(id))
    .filter((id) => !pantryIds.has(id) && !groceryIds.has(id))
    .slice(0, 4);
  const showProteinNudge =
    remaining.proteinG > 30 && missingProteinStaples.length >= 3;

  function addStaplesToGrocery() {
    let added = 0;
    for (const id of missingProteinStaples) {
      addStapleToGrocery(id);
      added += 1;
    }
    toast.success(
      `Added ${added} high-protein staple${added === 1 ? "" : "s"} to your grocery list.`,
    );
  }

  return (
    <section className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-violet-50/40 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-200">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Insights
          </p>
          <p className="text-sm font-semibold text-stone-900">
            You have{" "}
            <span className="text-emerald-700">
              {Math.round(remaining.kcal)} kcal
            </span>{" "}
            and{" "}
            <span className="text-violet-700">
              {Math.round(remaining.proteinG)} g protein
            </span>{" "}
            left today.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/ai-chef?${aiChefQuery}`}
          className="group inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
        >
          <ChefHat size={12} />
          Cook from pantry to fit
          <ArrowRight
            size={12}
            className="transition-transform motion-safe:group-hover:translate-x-0.5"
          />
        </Link>
        <Link
          href="/pantry"
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
        >
          <Refrigerator size={12} />
          Edit pantry
        </Link>
        <Link
          href="/grocery-list"
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
        >
          <ShoppingBasket size={12} />
          Grocery list
        </Link>
      </div>

      {showProteinNudge && (
        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
          <div className="flex items-start gap-2.5">
            <div className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-violet-100 text-violet-700">
              <Beef size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                Low on protein
              </p>
              <p className="text-sm font-semibold text-stone-900">
                {Math.round(remaining.proteinG)} g protein left, and a few
                cheap staples missing from your pantry.
              </p>
              <p className="mt-1 text-xs text-violet-900">
                {missingProteinStaples
                  .map((id) => INGREDIENT_MAP.get(id)?.name)
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <button
                type="button"
                onClick={addStaplesToGrocery}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-200 transition-all motion-safe:hover:-translate-y-0.5 hover:bg-violet-700"
              >
                <Plus size={12} />
                Add {missingProteinStaples.length} to grocery list
              </button>
            </div>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-5 border-t border-emerald-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Database picks that fit
          </p>
          <ul className="mt-2 space-y-2">
            {suggestions.map(({ r, n, cps, matchPct }) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 transition-shadow hover:shadow-sm"
              >
                <Link href={`/recipes/${r.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900 hover:text-emerald-700">
                    {r.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {Math.round(n.calories)} kcal · {Math.round(n.protein)} g protein
                    {matchPct > 0 && ` · ${matchPct}% pantry match`}
                  </p>
                </Link>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  ${cps.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 border-t border-emerald-100 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Quick questions
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            {
              q: "Am I on track today?",
              href: "/nourish/progress",
            },
            {
              q: "What can I cook from my pantry?",
              href: `/ai-chef?${aiChefQuery}`,
            },
            {
              q: "Find high-protein recipes",
              href: "/nourish/recipes",
            },
            {
              q: "How's my week looking?",
              href: "/nourish/progress",
            },
          ].map(({ q, href }) => (
            <Link
              key={q}
              href={href}
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50"
            >
              {q}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[10px] text-stone-500">
        Suggestions are based on your diary, goals, and pantry — not medical
        advice. Nutrition estimates may vary by brand, portion, and preparation.
      </p>
    </section>
  );
}
