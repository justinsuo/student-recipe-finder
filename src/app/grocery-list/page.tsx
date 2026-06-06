"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBasket, Trash2, Sparkles } from "lucide-react";
import {
  INGREDIENT_MAP,
  CATEGORY_LABEL,
} from "@/data/ingredients";
import { useAppStore } from "@/lib/AppStore";
import { recommendSmartBuys } from "@/lib/recipeScoring";
import { quoteIngredient } from "@/lib/pricing/pricingEngine";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { ThreeDLink } from "@/components/ui/ThreeDButton";
import { VisualEmptyState } from "@/components/ui/VisualEmptyState";
import type { IngredientCategory } from "@/lib/types";
import { RECIPE_MAP } from "@/data/recipes";

export default function GroceryListPage() {
  const {
    grocery,
    pantry,
    toggleGroceryChecked,
    removeGroceryItem,
    clearGrocery,
    addStapleToGrocery,
  } = useAppStore();

  const toast = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  function performClear() {
    const count = grocery.length;
    clearGrocery();
    toast.info(`Cleared ${count} item${count === 1 ? "" : "s"} from your list.`);
  }

  const grouped = useMemo(() => {
    const map = new Map<
      IngredientCategory,
      { id: string; name: string; cost: number; quantity: number; recipeIds: string[]; checked: boolean }[]
    >();
    let total = 0;
    let unchecked = 0;
    for (const item of grocery) {
      const ing = INGREDIENT_MAP.get(item.ingredientId);
      if (!ing) continue;
      const quote = quoteIngredient(item.ingredientId, item.quantity);
      const cost = quote?.totalCost ?? 0;
      total += cost;
      if (!item.checked) unchecked += cost;
      const list = map.get(ing.category) ?? [];
      list.push({
        id: ing.id,
        name: ing.name,
        cost,
        quantity: item.quantity,
        recipeIds: item.recipeIds,
        checked: item.checked,
      });
      map.set(ing.category, list);
    }
    return { map, total, unchecked };
  }, [grocery]);

  const smartBuys = useMemo(() => recommendSmartBuys(pantry), [pantry]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Grocery List"
        title="Your shopping list."
        description="Items from recipes you've added, plus smart suggestions. Check things off as you shop."
        tone="sky"
        trailing={
          grocery.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => setConfirmClear(true)}
            >
              Clear all
            </Button>
          ) : undefined
        }
      />

      {grocery.length === 0 ? (
        <VisualEmptyState
          icon={<ShoppingBasket size={28} strokeWidth={2.4} />}
          tone="teal"
          title="Your grocery list is clear."
          body="Add missing ingredients from a recipe — totals + region pricing land here."
          actions={
            <>
              <ThreeDLink href="/cheap-recipes" variant="primary" size="md">
                Browse cheap
              </ThreeDLink>
              <ThreeDLink href="/pantry" variant="secondary" size="md">
                Open pantry
              </ThreeDLink>
            </>
          }
        />
      ) : (
        <ScrollReveal as="section" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              eyebrow={
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBasket size={11} /> Shopping cart
                </span>
              }
              title={
                <span className="inline-flex items-baseline gap-3">
                  <AnimatedNumber value={grocery.length} duration={500} />{" "}
                  <span className="text-base font-normal text-stone-500">
                    {grocery.length === 1 ? "item" : "items"}
                  </span>
                </span>
              }
              description="Estimated unit prices. Actual store prices may vary."
              tone="sky"
              className="flex-1"
            />
            <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 px-5 py-3 text-right shadow-sm ring-1 ring-inset ring-emerald-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Estimated total
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                <AnimatedNumber
                  value={grouped.total}
                  duration={900}
                  decimals={2}
                  prefix="$"
                />
              </p>
              {grouped.unchecked < grouped.total && (
                <p className="text-xs text-emerald-700">
                  Remaining: $
                  <AnimatedNumber
                    value={grouped.unchecked}
                    duration={700}
                    decimals={2}
                  />
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {Array.from(grouped.map.entries()).map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {CATEGORY_LABEL[cat]}
                </p>
                <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-100">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleGroceryChecked(item.id)}
                        className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                        aria-label={`Check ${item.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            item.checked
                              ? "text-sm font-medium text-stone-500 line-through"
                              : "text-sm font-medium text-stone-900"
                          }
                        >
                          {item.name}
                        </p>
                        {item.recipeIds.length > 0 && (
                          <p className="mt-0.5 text-xs text-stone-500">
                            for{" "}
                            {item.recipeIds.slice(0, 2).map((rid, i) => {
                              const r = RECIPE_MAP.get(rid);
                              if (!r) return null;
                              return (
                                <span key={rid}>
                                  <Link
                                    href={`/recipes/${rid}`}
                                    className="text-emerald-700 hover:underline"
                                  >
                                    {r.name}
                                  </Link>
                                  {i < Math.min(item.recipeIds.length, 2) - 1
                                    ? ", "
                                    : ""}
                                </span>
                              );
                            })}
                            {item.recipeIds.length > 2 &&
                              ` +${item.recipeIds.length - 2} more`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-stone-900">
                          ${item.cost.toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeGroceryItem(item.id)}
                          className="mt-0.5 text-xs text-stone-400 hover:text-red-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {smartBuys.length > 0 && (
        <ScrollReveal as="section" className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white p-5 sm:p-6">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={11} /> Smart buys
              </span>
            }
            title="One cheap pickup, many more recipes"
            description="Adding one of these would unlock several meals from your existing pantry."
            tone="amber"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {smartBuys.map((sb, i) => {
              const ing = INGREDIENT_MAP.get(sb.ingredientId);
              if (!ing) return null;
              const alreadyOnList = grocery.some(
                (g) => g.ingredientId === sb.ingredientId,
              );
              return (
                <div
                  key={sb.ingredientId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-3 shadow-sm transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:animate-[fadeUp_500ms_ease-out_both]"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {ing.name}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-800">
                      Unlocks{" "}
                      <span className="font-semibold">
                        <AnimatedNumber value={sb.unlocks} duration={520} />
                      </span>{" "}
                      {sb.unlocks === 1 ? "recipe" : "recipes"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyOnList ? "outline" : "primary"}
                    disabled={alreadyOnList}
                    onClick={() => addStapleToGrocery(sb.ingredientId)}
                  >
                    {alreadyOnList ? "On list" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear your grocery list?"
        body={
          <>
            This removes all{" "}
            <span className="font-semibold text-stone-900">{grocery.length}</span>{" "}
            item{grocery.length === 1 ? "" : "s"} from your list. Your pantry
            and saved recipes aren&apos;t affected.
          </>
        }
        confirmLabel="Clear list"
        destructive
        onConfirm={performClear}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
