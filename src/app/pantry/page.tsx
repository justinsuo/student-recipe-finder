"use client";

import { useMemo, useState } from "react";
import {
  Refrigerator,
  Plus,
  X,
  Search,
  Clock4,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  INGREDIENTS,
  INGREDIENT_MAP,
  CATEGORY_LABEL,
  QUICK_ADD_STAPLES,
} from "@/data/ingredients";
import { PANTRY_PRESETS } from "@/data/pantryPresets";
import { useAppStore } from "@/lib/AppStore";
import {
  groupPantryResults,
  rankPantryRecipes,
  recommendSmartBuys,
} from "@/lib/recipeScoring";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Button } from "@/components/ui/Button";
import { VisualEmptyState } from "@/components/ui/VisualEmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ThreeDLink } from "@/components/ui/ThreeDButton";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PantryPhotoUpload } from "@/components/pantry/PantryPhotoUpload";
import { PantryVoiceInput } from "@/components/pantry/PantryVoiceInput";
import { PantrySmartAdd } from "@/components/pantry/PantrySmartAdd";
import { PantryAIChat } from "@/components/pantry/PantryAIChat";
import { ReceiptUpload } from "@/components/pantry/ReceiptUpload";
import { LocationSetup } from "@/components/pricing/LocationSetup";
import { getCustomIngredients } from "@/lib/customIngredientStorage";
import type { Ingredient, IngredientCategory } from "@/lib/types";

export default function PantryPage() {
  const {
    pantry,
    addPantryItem,
    removePantryItem,
    togglePantryUseSoon,
    clearPantry,
    addStapleToGrocery,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const toast = useToast();

  type ConfirmState =
    | { kind: "preset"; presetId: string; name: string; ids: string[] }
    | { kind: "clear" }
    | null;
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  function performLoadPreset(ingredientIds: string[]) {
    let added = 0;
    for (const id of ingredientIds) {
      if (pantry.some((p) => p.ingredientId === id)) continue;
      if (!INGREDIENT_MAP.has(id)) continue;
      addPantryItem({ ingredientId: id });
      added += 1;
    }
    toast.success(
      `Added ${added} item${added === 1 ? "" : "s"} to your pantry.`,
    );
  }

  function performClearPantry() {
    const count = pantry.length;
    clearPantry();
    toast.info(`Cleared ${count} pantry item${count === 1 ? "" : "s"}.`);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return [] as Ingredient[];
    const lower = search.toLowerCase();
    return INGREDIENTS.filter(
      (i) =>
        i.name.toLowerCase().includes(lower) &&
        !pantry.some((p) => p.ingredientId === i.id),
    ).slice(0, 8);
  }, [search, pantry]);

  const grouped = useMemo(() => {
    const map = new Map<IngredientCategory | "custom", Ingredient[]>();
    const customMap = new Map(
      getCustomIngredients().map((c) => [c.id, c]),
    );
    for (const item of pantry) {
      const ing = INGREDIENT_MAP.get(item.ingredientId);
      if (ing) {
        const list = map.get(ing.category) ?? [];
        list.push(ing);
        map.set(ing.category, list);
        continue;
      }
      // Custom ingredient — represent as a built-in shape so display logic
      // doesn't need to change.
      const c = customMap.get(item.ingredientId);
      if (!c) continue;
      const proxy: Ingredient = {
        id: c.id,
        name: c.displayName || c.canonicalName,
        category: "snack" as IngredientCategory,
        estimatedUnitCost: c.estimatedUnitCost ?? 0,
        unit: c.unit ?? "each",
      };
      const list = map.get("custom") ?? [];
      list.push(proxy);
      map.set("custom", list);
    }
    return map;
  }, [pantry]);

  const ranked = useMemo(() => rankPantryRecipes(pantry), [pantry]);
  const groups = useMemo(() => groupPantryResults(ranked, pantry), [ranked, pantry]);
  const smartBuys = useMemo(() => recommendSmartBuys(pantry), [pantry]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Pantry-to-Plate"
        title="What can you make right now?"
        description="Add what's in your kitchen. We'll surface recipes you can make, and AI Chef can generate brand-new ones from the same ingredients without making you retype them."
        tone="emerald"
        trailing={
          pantry.length > 0 ? (
            <ThreeDLink
              href="/ai-chef?usePantry=true"
              variant="primary"
              size="md"
              leftIcon={<Sparkles size={14} />}
            >
              Use in AI Chef
            </ThreeDLink>
          ) : undefined
        }
      />

      <LocationSetup />

      <ScrollReveal as="section" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Wand2 size={11} /> Quick start
            </span>
          }
          title="Start from a preset"
          description="Pick a starter pack to populate your pantry instantly. Anything already in your pantry is kept."
          tone="emerald"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PANTRY_PRESETS.map((preset, i) => (
            <button
              key={preset.id}
              onClick={() =>
                setConfirm({
                  kind: "preset",
                  presetId: preset.id,
                  name: preset.name,
                  ids: preset.ingredientIds,
                })
              }
              className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 text-left transition-all motion-safe:hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md motion-safe:animate-[fadeUp_500ms_ease-out_both]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className="text-3xl transition-transform motion-safe:group-hover:scale-110"
                aria-hidden
              >
                {preset.emoji}
              </span>
              <p className="text-sm font-semibold text-stone-900 group-hover:text-emerald-800">
                {preset.name}
              </p>
              <p className="text-xs leading-relaxed text-stone-600">
                {preset.description}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                +{preset.ingredientIds.length} items
              </span>
            </button>
          ))}
        </div>
      </ScrollReveal>

      <PantrySmartAdd />

      <PantryVoiceInput />

      <PantryPhotoUpload />

      <ReceiptUpload />

      <PantryAIChat />

      <ScrollReveal as="section" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Refrigerator size={11} /> Your pantry
            </span>
          }
          title={
            <span className="inline-flex items-baseline gap-3">
              <AnimatedNumber value={pantry.length} duration={520} />{" "}
              <span className="text-base font-normal text-stone-500">
                {pantry.length === 1 ? "ingredient" : "ingredients"}
              </span>
            </span>
          }
          trailing={
            pantry.length > 0 ? (
              <button
                onClick={() => setConfirm({ kind: "clear" })}
                className="text-xs font-medium text-stone-500 hover:text-red-600"
              >
                Clear all
              </button>
            ) : undefined
          }
        />

        <div className="relative mt-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search to add ingredients (rice, eggs, tofu…)"
            className="w-full rounded-full border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            aria-label="Search ingredients"
          />
          {filtered.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-lg">
              {filtered.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => {
                    addPantryItem({ ingredientId: ing.id });
                    setSearch("");
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-emerald-50"
                >
                  <span className="font-medium text-stone-800">{ing.name}</span>
                  <span className="text-xs text-stone-500">
                    {CATEGORY_LABEL[ing.category]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Quick add staples
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_ADD_STAPLES.map((id) => {
              const ing = INGREDIENT_MAP.get(id);
              if (!ing) return null;
              const alreadyAdded = pantry.some((p) => p.ingredientId === id);
              return (
                <button
                  key={id}
                  disabled={alreadyAdded}
                  onClick={() => addPantryItem({ ingredientId: id })}
                  className={
                    alreadyAdded
                      ? "rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700"
                      : "inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }
                >
                  {!alreadyAdded && <Plus size={12} />}
                  {ing.name}
                </button>
              );
            })}
          </div>
        </div>

        {pantry.length > 0 ? (
          <div className="mt-6 space-y-4">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {category === "custom"
                    ? "Custom / AI-recognized"
                    : CATEGORY_LABEL[category]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((ing) => {
                    const item = pantry.find((p) => p.ingredientId === ing.id);
                    const useSoon = item?.useSoon ?? false;
                    return (
                      <span
                        key={ing.id}
                        className={
                          useSoon
                            ? "group flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
                            : "group flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-800"
                        }
                      >
                        {useSoon && <Clock4 size={11} />}
                        {ing.name}
                        <button
                          onClick={() => togglePantryUseSoon(ing.id)}
                          title={useSoon ? "Unmark" : "Mark as use-soon"}
                          className="ml-0.5 text-stone-500 hover:text-amber-700"
                          aria-label="Toggle use soon"
                        >
                          <Clock4 size={11} />
                        </button>
                        <button
                          onClick={() => removePantryItem(ing.id)}
                          className="ml-0.5 text-stone-500 hover:text-red-600"
                          aria-label={`Remove ${ing.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-center text-sm text-stone-600">
            Start by tapping a few quick-add staples above ↑
          </div>
        )}
      </ScrollReveal>

      {pantry.length === 0 ? (
        <VisualEmptyState
          icon={<Refrigerator size={28} strokeWidth={2.4} />}
          tone="basil"
          title="Your pantry is empty."
          body="Tell Waivy what you have so AI Chef cooks from real ingredients."
        />
      ) : (
        <div className="space-y-10">
          {smartBuys.length > 0 && (
            <ScrollReveal as="section" className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white p-5 sm:p-6">
              <SectionHeading
                eyebrow={
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={11} /> Smart buys
                  </span>
                }
                title="One purchase unlocks more recipes"
                description="The cheapest single item to add right now, ranked by how many new meals it unlocks."
                tone="amber"
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {smartBuys.map((sb, i) => {
                  const ing = INGREDIENT_MAP.get(sb.ingredientId);
                  if (!ing) return null;
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
                        variant="outline"
                        onClick={() => addStapleToGrocery(sb.ingredientId)}
                      >
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          )}

          {groups.useSoon.length > 0 && (
            <RecipeGroup
              title="Use-soon recipes"
              description="These use ingredients you've marked as expiring."
              recipes={groups.useSoon}
              tone="amber"
            />
          )}

          <RecipeGroup
            title="Can make now"
            description="All ingredients on hand."
            recipes={groups.canMakeNow}
            tone="green"
          />

          <RecipeGroup
            title="Need 1–2 cheap items"
            description="You're so close — just a couple of low-cost items needed."
            recipes={groups.needFewItems}
            tone="emerald"
          />

          <RecipeGroup
            title="Best value if you buy one thing"
            description="A single addition would unlock these meals."
            recipes={groups.buyOneUnlock}
            tone="sky"
          />
        </div>
      )}

      <ConfirmDialog
        open={confirm?.kind === "preset"}
        title={
          confirm?.kind === "preset"
            ? `Add ${confirm.name}?`
            : "Add preset?"
        }
        body={
          confirm?.kind === "preset" ? (
            <>
              This adds{" "}
              <span className="font-semibold text-stone-900">
                {confirm.ids.filter((id) => !pantry.some((p) => p.ingredientId === id)).length}{" "}
                new item
                {confirm.ids.filter((id) => !pantry.some((p) => p.ingredientId === id)).length === 1
                  ? ""
                  : "s"}
              </span>{" "}
              to your pantry. Items you already have are skipped.
            </>
          ) : null
        }
        confirmLabel={
          confirm?.kind === "preset"
            ? `Add ${confirm.ids.filter((id) => !pantry.some((p) => p.ingredientId === id)).length} items`
            : "Add"
        }
        onConfirm={() => {
          if (confirm?.kind === "preset") performLoadPreset(confirm.ids);
        }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm?.kind === "clear"}
        title="Clear your pantry?"
        body={
          <>
            This removes all{" "}
            <span className="font-semibold text-stone-900">{pantry.length}</span>{" "}
            pantry items from this device. Saved recipes and your grocery
            list aren&apos;t affected.
          </>
        }
        confirmLabel="Clear pantry"
        destructive
        onConfirm={performClearPantry}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function RecipeGroup({
  title,
  description,
  recipes,
  tone,
}: {
  title: string;
  description: string;
  recipes: ReturnType<typeof rankPantryRecipes>;
  tone: "green" | "emerald" | "amber" | "sky";
}) {
  if (recipes.length === 0) return null;
  const tones: Record<string, "emerald" | "amber" | "sky"> = {
    green: "emerald",
    emerald: "emerald",
    amber: "amber",
    sky: "sky",
  };
  return (
    <ScrollReveal as="section">
      <SectionHeading
        eyebrow={`${recipes.length} match${recipes.length === 1 ? "" : "es"}`}
        title={title}
        description={description}
        tone={tones[tone]}
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.slice(0, 6).map((r) => (
          <RecipeCard key={r.recipe.id} result={r} from="pantry" />
        ))}
      </div>
    </ScrollReveal>
  );
}
