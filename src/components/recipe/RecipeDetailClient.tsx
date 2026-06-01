"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clock,
  Coins,
  Flame,
  Soup,
  ShoppingBasket,
  ChefHat,
  Sparkles,
  Lightbulb,
  Layers,
  ArrowRight,
  Timer,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/lib/AppStore";
import {
  calculateCostPerServing,
  calculateRecipeCost,
  ingredientCostBreakdown,
  pantrySetFromItems,
  calculateMissingIngredients,
} from "@/lib/recipeScoring";
import type { Recipe } from "@/lib/types";

const equipmentLabel: Record<string, string> = {
  microwave: "Microwave",
  stovetop: "Stovetop",
  oven: "Oven",
  "rice-cooker": "Rice cooker",
  "air-fryer": "Air fryer",
  "no-kitchen": "No kitchen",
};

export function RecipeDetailClient({ recipe }: { recipe: Recipe }) {
  const { isSaved, toggleSaved, pantry, addGroceryItems } = useAppStore();
  const saved = isSaved(recipe.id);
  const totalCost = calculateRecipeCost(recipe);
  const cps = calculateCostPerServing(recipe);
  const breakdown = ingredientCostBreakdown(recipe);

  const pantrySet = pantrySetFromItems(pantry);
  const missing = calculateMissingIngredients(recipe, pantrySet);

  const [cookingMode, setCookingMode] = useState(false);

  if (cookingMode) {
    return <CookingMode recipe={recipe} onExit={() => setCookingMode(false)} />;
  }

  return (
    <div className="space-y-8">
      <Link
        href="/cheap-recipes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-emerald-700"
      >
        <ArrowLeft size={14} /> Back to recipes
      </Link>

      <header className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="green" icon={<Coins size={12} />}>
              ${cps.toFixed(2)}/serving
            </Badge>
            <Badge tone="amber" icon={<Clock size={12} />}>
              {recipe.totalTimeMinutes} min
            </Badge>
            <Badge tone="stone" icon={<Flame size={12} />}>
              {recipe.difficulty}
            </Badge>
            <Badge tone="violet" icon={<Soup size={12} />}>
              {equipmentLabel[recipe.equipment[0]] ?? recipe.equipment[0]}
            </Badge>
            {recipe.dietTags.map((d) => (
              <Badge key={d} tone="emerald">
                {d}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
            {recipe.name}
          </h1>
          <p className="text-stone-600">{recipe.description}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => setCookingMode(true)} leftIcon={<Play size={16} />}>
              Start cooking
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleSaved(recipe.id)}
              leftIcon={
                saved ? (
                  <BookmarkCheck size={16} className="text-emerald-600" />
                ) : (
                  <Bookmark size={16} />
                )
              }
            >
              {saved ? "Saved" : "Save recipe"}
            </Button>
            {missing.length > 0 && (
              <Button
                variant="secondary"
                onClick={() =>
                  addGroceryItems(
                    recipe,
                    missing.map((m) => m.ingredientId),
                  )
                }
                leftIcon={<ShoppingBasket size={16} />}
              >
                Add {missing.length} to grocery list
              </Button>
            )}
          </div>
        </div>

        <div
          className={`flex aspect-square w-full max-w-xs items-center justify-center justify-self-center rounded-3xl ${recipe.accentColor} shadow-sm md:justify-self-end`}
        >
          <span className="text-8xl" aria-hidden>
            {recipe.emoji}
          </span>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
            <Coins size={16} /> Cost breakdown
          </h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {breakdown.map((b, idx) => (
              <li
                key={`${b.ingredient?.id ?? "x"}-${idx}`}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-800">
                    {b.ingredient?.name}{" "}
                    {b.optional && (
                      <span className="text-xs text-stone-500">(optional)</span>
                    )}
                  </p>
                  <p className="text-xs text-stone-500">
                    {b.quantity} {b.ingredient?.unit}
                  </p>
                </div>
                <p className="font-medium text-stone-900">${b.cost.toFixed(2)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-xs text-emerald-800">Total</p>
              <p className="text-lg font-bold text-emerald-900">
                ${totalCost.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-800">
                Per serving × {recipe.servings}
              </p>
              <p className="text-lg font-bold text-emerald-900">
                ${cps.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
            <ChefHat size={16} /> Steps
          </h2>
          <ol className="mt-3 space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-800">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {recipe.cheapTips.length > 0 && (
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
              <Sparkles size={16} /> Why it&apos;s cheap
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {recipe.cheapTips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden>💡</span> {t}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {recipe.substitutions.length > 0 && (
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
              <Layers size={16} /> Cheap swaps
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {recipe.substitutions.map((s, i) => {
                const ing = breakdown.find(
                  (b) => b.ingredient?.id === s.forIngredientId,
                )?.ingredient;
                return (
                  <li key={i} className="rounded-xl bg-stone-50 p-2.5">
                    <p className="font-medium text-stone-900">
                      {ing?.name ?? s.forIngredientId} → {s.swap}
                    </p>
                    {s.savings && (
                      <p className="mt-0.5 text-xs text-emerald-700">{s.savings}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {(recipe.healthierTips ?? []).length > 0 && (
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-700">
              <Lightbulb size={16} /> Make it healthier
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {recipe.healthierTips!.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </Card>
        )}

        {(recipe.batchPrepTips ?? []).length > 0 && (
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-700">
              <Timer size={16} /> Batch prep
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {recipe.batchPrepTips!.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {(recipe.whatToBuyNext ?? []).length > 0 && (
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
            🛍️ What to buy next time
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-stone-700">
            {recipe.whatToBuyNext!.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
          🥗 Nutrition (estimate)
        </h2>
        <div className="mt-3 grid grid-cols-4 gap-3">
          <NutritionPill
            label="Calories"
            value={recipe.estimatedNutrition.calories}
            unit=""
          />
          <NutritionPill
            label="Protein"
            value={recipe.estimatedNutrition.protein}
            unit="g"
            highlight
          />
          <NutritionPill label="Carbs" value={recipe.estimatedNutrition.carbs} unit="g" />
          <NutritionPill label="Fat" value={recipe.estimatedNutrition.fat} unit="g" />
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Per serving. Estimates only — not for medical use.
        </p>
      </Card>
    </div>
  );
}

function NutritionPill({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl bg-emerald-100 px-3 py-3 text-center"
          : "rounded-2xl bg-stone-100 px-3 py-3 text-center"
      }
    >
      <p
        className={
          highlight ? "text-xs font-medium text-emerald-800" : "text-xs font-medium text-stone-600"
        }
      >
        {label}
      </p>
      <p
        className={
          highlight
            ? "text-lg font-bold text-emerald-900"
            : "text-lg font-bold text-stone-900"
        }
      >
        {value}
        {unit}
      </p>
    </div>
  );
}

function CookingMode({
  recipe,
  onExit,
}: {
  recipe: Recipe;
  onExit: () => void;
}) {
  const [step, setStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const total = recipe.steps.length;
  const isLast = step === total - 1;

  const detectMinutes = (text: string): number | null => {
    const m = text.match(/(\d+)\s*(min|minute|minutes)/i);
    return m ? parseInt(m[1], 10) : null;
  };
  const suggestedMins = detectMinutes(recipe.steps[step] ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-emerald-700"
        >
          <ArrowLeft size={14} /> Back to recipe
        </button>
        <p className="text-sm text-stone-500">
          Step {step + 1} of {total}
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-medium text-emerald-700">{recipe.name}</p>
        <h2 className="mt-3 text-3xl font-bold leading-snug text-stone-900 sm:text-4xl">
          {recipe.steps[step]}
        </h2>

        {suggestedMins !== null && timerSeconds === null && (
          <div className="mt-6">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Timer size={16} />}
              onClick={() => setTimerSeconds(suggestedMins * 60)}
            >
              Start {suggestedMins} min timer
            </Button>
          </div>
        )}

        {timerSeconds !== null && (
          <CountdownTimer
            seconds={timerSeconds}
            onDone={() => setTimerSeconds(null)}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={step === 0}
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => {
            setTimerSeconds(null);
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          Previous
        </Button>
        {isLast ? (
          <Button onClick={onExit} leftIcon={<CheckCircle2 size={16} />} variant="primary">
            Done cooking
          </Button>
        ) : (
          <Button
            onClick={() => {
              setTimerSeconds(null);
              setStep((s) => Math.min(total - 1, s + 1));
            }}
            rightIcon={<ArrowRight size={16} />}
          >
            Next step
          </Button>
        )}
      </div>
    </div>
  );
}

function CountdownTimer({
  seconds,
  onDone,
}: {
  seconds: number;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) {
      onDone();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onDone]);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return (
    <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-stone-900 px-5 py-3 text-white">
      <Timer size={20} />
      <span className="font-mono text-2xl">
        {mm}:{ss.toString().padStart(2, "0")}
      </span>
      <button
        onClick={onDone}
        className="rounded-full bg-stone-800 px-3 py-1 text-xs hover:bg-stone-700"
      >
        Stop
      </button>
    </div>
  );
}
