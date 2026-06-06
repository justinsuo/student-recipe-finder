"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clock,
  Coins,
  Flame,
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
import { ThreeDButton } from "@/components/ui/ThreeDButton";
import { useToast } from "@/components/ui/Toast";
import { hapticSuccess } from "@/lib/haptics";
import { bumpProgress, milestoneMessage } from "@/lib/userProgress";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { CookingMethodCard } from "@/components/recipe/CookingMethodCard";
import { EquipmentBadges } from "@/components/recipe/EquipmentBadge";
import { DetailedSteps } from "@/components/recipe/DetailedSteps";
import { IngredientPriceRow } from "@/components/pricing/IngredientPriceRow";
import { RecipeAIRepriceButton } from "@/components/pricing/RecipeAIRepriceButton";
import { quoteRecipe } from "@/lib/pricing/pricingEngine";
import { bestEffortNutrition, isHighProtein } from "@/lib/nutritionEngine";
import { useAppStore } from "@/lib/AppStore";
import {
  calculateCostPerServing,
  calculateRecipeCost,
  ingredientCostBreakdown,
  pantrySetFromItems,
  calculateMissingIngredients,
} from "@/lib/recipeScoring";
import { LogRecipeButton } from "@/components/nourish/LogRecipeButton";
import type { Recipe } from "@/lib/types";

// Sources users can come from. Anything else (or no param) falls back to
// "back to recipes" + cheap-recipes.
const BACK_LINKS: Record<string, { label: string; href: string }> = {
  "nourish-recipes": { label: "Back to Nourish recipes", href: "/nourish/recipes" },
  cheap: { label: "Back to cheap recipes", href: "/cheap-recipes" },
  saved: { label: "Back to saved", href: "/saved" },
  pantry: { label: "Back to pantry", href: "/pantry" },
  explore: { label: "Back to explore", href: "/explore" },
  home: { label: "Back to home", href: "/" },
};

export function RecipeDetailClient({ recipe }: { recipe: Recipe }) {
  return (
    <Suspense fallback={<div className="h-6 w-32 animate-pulse rounded bg-stone-100" />}>
      <RecipeDetailBody recipe={recipe} />
    </Suspense>
  );
}

function RecipeDetailBody({ recipe }: { recipe: Recipe }) {
  const { isSaved, toggleSaved, pantry, addGroceryItems } = useAppStore();
  const toast = useToast();
  // Guard against rapid double-clicks: if two presses land in the same
  // batch both see `wasSaved=false` and the progress counter would bump
  // twice for one save event. The ref locks the bump to one per
  // save→unsave cycle.
  const lastBumpedIdRef = useRef<string | null>(null);

  function handleToggleSaved() {
    const wasSaved = isSaved(recipe.id);
    toggleSaved(recipe.id);
    if (!wasSaved) {
      if (lastBumpedIdRef.current === recipe.id) return;
      lastBumpedIdRef.current = recipe.id;
      const count = bumpProgress("recipesSaved");
      const milestone = milestoneMessage("recipesSaved", count);
      if (milestone) toast.reward(milestone);
    } else {
      // Unsaved — clear the lock so a future re-save bumps again.
      if (lastBumpedIdRef.current === recipe.id) lastBumpedIdRef.current = null;
    }
  }

  function handleAddMissingToGrocery(missingIds: string[]) {
    if (missingIds.length === 0) return;
    addGroceryItems(recipe, missingIds);
    hapticSuccess();
    const count = bumpProgress("groceryItemsAdded", missingIds.length);
    const milestone = milestoneMessage("groceryItemsAdded", count);
    if (milestone) toast.reward(milestone);
    else toast.success(
      `Added ${missingIds.length} item${missingIds.length === 1 ? "" : "s"} to your grocery list.`,
    );
  }
  const saved = isSaved(recipe.id);
  // bump when the user edits a price so the breakdown re-quotes
  const [priceRev, setPriceRev] = useState(0);
  const totalCost = calculateRecipeCost(recipe);
  const cps = calculateCostPerServing(recipe);
  const breakdown = ingredientCostBreakdown(recipe);
  const localQuote = quoteRecipe(recipe);
  // silence "unused" warning when priceRev only triggers re-render
  void priceRev;

  const pantrySet = pantrySetFromItems(pantry);
  const missing = calculateMissingIngredients(recipe, pantrySet);

  const [cookingMode, setCookingMode] = useState(false);

  const params = useSearchParams();
  const fromKey = params.get("from") ?? "";
  const back = BACK_LINKS[fromKey] ?? {
    label: "Back to recipes",
    href: "/cheap-recipes",
  };

  if (cookingMode) {
    return <CookingMode recipe={recipe} onExit={() => setCookingMode(false)} />;
  }

  return (
    <div className="space-y-6">
      <Link
        href={back.href}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-emerald-700"
      >
        <ArrowLeft
          size={14}
          className="transition-transform motion-safe:group-hover:-translate-x-0.5"
        />{" "}
        {back.label}
      </Link>

      {/* Identity first: title, description, key facts, primary actions */}
      <header className="space-y-4">
        <p
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 motion-safe:animate-[fadeUp_460ms_ease-out_both]"
        >
          <span
            aria-hidden
            className="h-[2px] w-5 rounded-full bg-emerald-500"
          />
          Recipe
        </p>
        <h1
          className="text-3xl font-bold leading-[1.05] tracking-tight text-stone-900 motion-safe:animate-[fadeUp_540ms_ease-out_both] sm:text-[2.5rem]"
          style={{ animationDelay: "60ms" }}
        >
          {recipe.name}
        </h1>
        <p
          className="max-w-3xl text-base leading-relaxed text-stone-600 motion-safe:animate-[fadeUp_620ms_ease-out_both]"
          style={{ animationDelay: "140ms" }}
        >
          {recipe.description}
        </p>

        <div
          className="flex flex-wrap gap-2 motion-safe:animate-[fadeUp_680ms_ease-out_both]"
          style={{ animationDelay: "200ms" }}
        >
          <Badge tone="green" icon={<Coins size={12} />}>
            ${cps.toFixed(2)}/serving
          </Badge>
          <Badge tone="amber" icon={<Clock size={12} />}>
            {recipe.totalTimeMinutes} min
          </Badge>
          <Badge tone="stone" icon={<Flame size={12} />}>
            {recipe.difficulty}
          </Badge>
          <Badge tone="stone">{recipe.servings} servings</Badge>
          {recipe.dietTags.map((d) => (
            <Badge key={d} tone="emerald">
              {d}
            </Badge>
          ))}
        </div>
        <EquipmentBadges recipe={recipe} />

        <div
          className="flex flex-wrap gap-3 pt-1 motion-safe:animate-[fadeUp_720ms_ease-out_both]"
          style={{ animationDelay: "260ms" }}
        >
          <ThreeDButton
            variant="success"
            size="lg"
            onClick={() => setCookingMode(true)}
            leftIcon={<Play size={16} />}
          >
            Start cooking
          </ThreeDButton>
          <ThreeDButton
            variant="secondary"
            size="lg"
            onClick={handleToggleSaved}
            leftIcon={
              saved ? (
                <BookmarkCheck
                  size={16}
                  className="text-emerald-600 motion-safe:animate-[popIn_220ms_ease-out]"
                />
              ) : (
                <Bookmark size={16} />
              )
            }
          >
            {saved ? "Saved" : "Save recipe"}
          </ThreeDButton>
          {missing.length > 0 && (
            <ThreeDButton
              variant="warning"
              size="lg"
              onClick={() =>
                handleAddMissingToGrocery(missing.map((m) => m.ingredientId))
              }
              leftIcon={<ShoppingBasket size={16} />}
              title={`Missing: ${missing.map((m) => m.ingredientId).slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`}
            >
              Add {missing.length} missing {missing.length === 1 ? "item" : "items"} to grocery
            </ThreeDButton>
          )}
        </div>
      </header>

      {/* Log to Nourish */}
      <LogRecipeButton recipe={recipe} />

      {/* Media second */}
      <RecipeImage recipe={recipe} variant="hero" showAttribution className="overflow-hidden" />

      {recipe.youtubeId && (
        <div className="overflow-hidden rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 bg-stone-100 px-4 py-2.5">
            <Play size={14} className="text-red-500 fill-red-500" />
            <span className="text-sm font-medium text-stone-700">Watch how to make it</span>
          </div>
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${recipe.youtubeId}`}
              title={`How to make ${recipe.name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
            <Coins size={16} /> Cost breakdown
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Prices applied at <span className="font-semibold text-stone-700">{localQuote.regionLabel}</span> (×{localQuote.multiplier.toFixed(2)}). Tap ✨ to estimate any single price with AI, or ✎ to set your own.
          </p>
          <div className="mt-3">
            <RecipeAIRepriceButton
              recipe={recipe}
              onComplete={() => setPriceRev((n) => n + 1)}
            />
          </div>
          <ul className="mt-3 divide-y divide-stone-100">
            {breakdown.map((b, idx) => {
              if (!b.ingredient) {
                return (
                  <li
                    key={`x-${idx}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-stone-500">Unknown ingredient</span>
                    <span className="font-medium text-stone-900">${b.cost.toFixed(2)}</span>
                  </li>
                );
              }
              return (
                <IngredientPriceRow
                  key={`${b.ingredient.id}-${idx}`}
                  ingredient={b.ingredient}
                  quantity={b.quantity}
                  optional={b.optional}
                  onChange={() => setPriceRev((n) => n + 1)}
                />
              );
            })}
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

      {recipe.detailedSteps && recipe.detailedSteps.length > 0 && (
        <DetailedSteps steps={recipe.detailedSteps} />
      )}

      {recipe.flavorExplanation && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            Why this tastes good
          </h2>
          <p className="mt-2 text-sm text-stone-700">{recipe.flavorExplanation}</p>
        </Card>
      )}

      {(recipe.seasoningUpgrades?.length ?? 0) > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            Seasoning upgrades
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            {recipe.seasoningUpgrades!.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Card>
      )}

      {(recipe.tasteTroubleshooting?.length ?? 0) > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            If it tastes flat
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            {recipe.tasteTroubleshooting!.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Card>
      )}

      <CookingMethodCard recipe={recipe} />

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

      {(() => {
        const n = bestEffortNutrition(recipe);
        const hp = isHighProtein(n.estimate);
        const confLabel =
          n.confidence === "high"
            ? "High confidence"
            : n.confidence === "medium"
              ? "Medium confidence"
              : "Low confidence";
        return (
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
              🥗 Nutrition per serving
              {hp && (
                <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  high protein
                </span>
              )}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {n.source === "calculated"
                ? `Calculated from ingredients · ${confLabel.toLowerCase()}`
                : "From recipe author · medium confidence"}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-3">
              <NutritionPill label="Calories" value={n.estimate.calories} unit="" />
              <NutritionPill label="Protein" value={n.estimate.protein} unit="g" highlight />
              <NutritionPill label="Carbs" value={n.estimate.carbs} unit="g" />
              <NutritionPill label="Fat" value={n.estimate.fat} unit="g" />
            </div>
            {n.estimate.fiber !== undefined && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                <NutritionPill label="Fiber" value={n.estimate.fiber} unit="g" />
              </div>
            )}
            <p className="mt-3 text-xs text-stone-500">
              Estimated from ingredients and serving size. Actual values vary by brand and preparation.
            </p>
          </Card>
        );
      })()}
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
  // Keep the latest onDone in a ref so the tick effect doesn't re-run
  // whenever the parent passes a fresh inline arrow.
  const onDoneRef = useRef(onDone);
  const firedRef = useRef(false);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  // If the parent reuses this timer for a new step (seconds changes),
  // restart the countdown cleanly.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(seconds);
    firedRef.current = false;
  }, [seconds]);
  useEffect(() => {
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onDoneRef.current();
      }
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return (
    <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-stone-900 px-5 py-3 text-white">
      <Timer size={20} />
      <span className="font-mono text-2xl">
        {mm}:{ss.toString().padStart(2, "0")}
      </span>
      <button
        aria-label="Stop timer"
        onClick={() => {
          firedRef.current = true;
          onDoneRef.current();
        }}
        className="rounded-full bg-stone-800 px-3 py-1 text-xs hover:bg-stone-700"
      >
        Stop
      </button>
    </div>
  );
}
