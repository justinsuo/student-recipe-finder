"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShoppingBasket, Trash2, Sparkles } from "lucide-react";
import {
  INGREDIENT_MAP,
  CATEGORY_LABEL,
} from "@/data/ingredients";
import { useAppStore } from "@/lib/AppStore";
import { recommendSmartBuys } from "@/lib/recipeScoring";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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
      const cost = ing.estimatedUnitCost * item.quantity;
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-700">Grocery List</p>
          <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
            Your shopping list
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stone-600">
            Items from recipes you&apos;ve added, plus smart suggestions. Check
            things off as you shop.
          </p>
        </div>
        {grocery.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={clearGrocery}
          >
            Clear all
          </Button>
        )}
      </header>

      {grocery.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Your grocery list is empty"
          description="Add missing ingredients from recipes you want to make, or grab a smart-buy below to unlock more recipes."
          action={
            <Link
              href="/pantry"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Browse recipes
            </Link>
          }
        />
      ) : (
        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
                <ShoppingBasket size={16} /> {grocery.length} items
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Estimated unit prices; actual store prices may vary.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
              <p className="text-xs text-emerald-800">Estimated total</p>
              <p className="text-2xl font-bold text-emerald-900">
                ${grouped.total.toFixed(2)}
              </p>
              {grouped.unchecked < grouped.total && (
                <p className="text-xs text-emerald-700">
                  Remaining: ${grouped.unchecked.toFixed(2)}
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
        </section>
      )}

      {smartBuys.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-800">
            <Sparkles size={16} /> Smart buy suggestions
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            One cheap pickup that would unlock several more recipes.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {smartBuys.map((sb) => {
              const ing = INGREDIENT_MAP.get(sb.ingredientId);
              if (!ing) return null;
              const alreadyOnList = grocery.some(
                (g) => g.ingredientId === sb.ingredientId,
              );
              return (
                <div
                  key={sb.ingredientId}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {ing.name}
                    </p>
                    <p className="text-xs text-stone-600">
                      Unlocks {sb.unlocks} {sb.unlocks === 1 ? "recipe" : "recipes"}
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
        </section>
      )}
    </div>
  );
}
