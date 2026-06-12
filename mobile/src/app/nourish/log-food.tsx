/**
 * Log Food (modal) — search USDA (graceful when offline / unconfigured), pick
 * from recent + custom foods, quick-add a manual macro entry, or log a saved /
 * seed Waivy recipe straight into the Nourish diary.
 */
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { Screen, ScreenHeader } from "~/components/Screen";
import {
  Txt,
  Row,
  Spacer,
  Card,
  Press,
  Button,
  Badge,
  SegmentedControl,
  Field,
  EmptyState,
  SectionHeading,
} from "~/components/ui";
import { Sheet } from "~/components/Sheet";
import { toast } from "~/components/Toast";
import { tap } from "~/lib/haptics";
import { colors, space, radius, accent } from "~/theme";

import { useRecentFoods, logFood, nourish } from "~/lib/stores/nourish";
import { useSaved } from "~/lib/stores/app";
import { mealSlotNow, logRecipeAsMeal } from "~/lib/actions";
import { allSeedViews, getAnyView, type RecipeView } from "~/lib/recipes";
import type { FoodItem, MealSlot } from "@/lib/nourish/types";

import { useFoodSearch, usingDemoKey } from "@/lib/nourish/usdaClient";

const MEAL_OPTIONS: { label: string; value: MealSlot }[] = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

function macroLine(f: FoodItem): string {
  const bits = [
    `${Math.round(f.kcal)} cal`,
    `${Math.round(f.proteinG)}P`,
    `${Math.round(f.carbG)}C`,
    `${Math.round(f.fatG)}F`,
  ];
  return bits.join(" · ");
}

/** A tappable food row (recent / custom / search result). */
function FoodRow({
  food,
  onPress,
  tone = "nourish",
}: {
  food: FoodItem;
  onPress: () => void;
  tone?: keyof typeof accent;
}) {
  return (
    <Press onPress={onPress} scaleTo={0.98} style={rowStyle}>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="subheading" numberOfLines={1}>
          {food.name}
        </Txt>
        <Txt variant="caption" muted numberOfLines={1}>
          {food.servingDescription}
          {food.brand ? ` · ${food.brand}` : ""}
        </Txt>
        <Txt variant="caption" color={accent[tone].shadow} weight="700">
          {macroLine(food)}
        </Txt>
      </View>
      <Feather name="plus-circle" size={22} color={colors.basil} />
    </Press>
  );
}

const rowStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: space.md,
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: space.md,
  paddingHorizontal: space.lg,
};

export default function LogFood() {
  const [meal, setMeal] = useState<MealSlot>(() => mealSlotNow());
  const [query, setQuery] = useState("");

  const recent = useRecentFoods();
  const { saved } = useSaved();

  // Custom foods (read once; refreshed when we add a new one via local state).
  const [customBump, setCustomBump] = useState(0);
  const customFoods = useMemo<FoodItem[]>(
    () => nourish.getCustomFoods(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customBump],
  );

  // USDA search — degrades gracefully (empty + friendly note when offline/unconfigured).
  const { results, loading, error } = useFoodSearch(query);
  const searching = query.trim().length >= 2;

  // Recipes pickable from the "Log a Waivy recipe" sheet.
  const seedViews = useMemo(() => allSeedViews(), []);
  const savedViews = useMemo<RecipeView[]>(() => {
    const seen = new Set<string>();
    const out: RecipeView[] = [];
    for (const id of saved) {
      if (seen.has(id)) continue;
      const v = getAnyView(id);
      if (v) {
        out.push(v);
        seen.add(id);
      }
    }
    return out;
  }, [saved]);

  // ── Servings stepper sheet ──────────────────────────────────────────────────
  const [pending, setPending] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);

  function openServings(food: FoodItem) {
    tap();
    setServings(1);
    setPending(food);
  }

  function confirmLog() {
    if (!pending) return;
    logFood(pending, meal, servings);
    const label = MEAL_OPTIONS.find((m) => m.value === meal)?.label ?? "meal";
    setPending(null);
    toast(`Logged to ${label}`, "success");
    router.back();
  }

  // ── Quick add sheet ─────────────────────────────────────────────────────────
  const [quickOpen, setQuickOpen] = useState(false);
  const [qName, setQName] = useState("");
  const [qKcal, setQKcal] = useState("");
  const [qProtein, setQProtein] = useState("");
  const [qCarb, setQCarb] = useState("");
  const [qFat, setQFat] = useState("");
  const [qSave, setQSave] = useState(false);

  function resetQuick() {
    setQName("");
    setQKcal("");
    setQProtein("");
    setQCarb("");
    setQFat("");
    setQSave(false);
  }

  function buildQuickFood(): FoodItem | null {
    const name = qName.trim();
    const kcal = Number(qKcal);
    if (!name || !Number.isFinite(kcal) || kcal <= 0) return null;
    const num = (s: string) => {
      const n = Number(s);
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
    };
    return {
      id: nourish.newId(),
      source: "custom",
      name,
      servingDescription: "1 serving",
      kcal: Math.round(kcal),
      proteinG: num(qProtein),
      carbG: num(qCarb),
      fatG: num(qFat),
    };
  }

  function submitQuick() {
    const food = buildQuickFood();
    if (!food) {
      toast("Add a name and calories first", "error");
      return;
    }
    if (qSave) {
      nourish.saveCustomFood(food);
      setCustomBump((n) => n + 1);
    }
    setQuickOpen(false);
    resetQuick();
    openServings(food);
  }

  // ── Recipe picker sheet ──────────────────────────────────────────────────────
  const [recipeOpen, setRecipeOpen] = useState(false);
  const recipeList = useMemo<RecipeView[]>(() => {
    const seen = new Set<string>();
    const out: RecipeView[] = [];
    for (const v of [...savedViews, ...seedViews]) {
      if (seen.has(v.id)) continue;
      out.push(v);
      seen.add(v.id);
    }
    return out;
  }, [savedViews, seedViews]);

  function logRecipe(view: RecipeView) {
    tap();
    const kcal = logRecipeAsMeal(view.name, view.nutrition, view.id);
    setRecipeOpen(false);
    toast(`Logged ${view.name} · ${kcal} cal`, "success");
    router.back();
  }

  const usdaNote = usingDemoKey()
    ? "Using the free demo search — add a USDA key for unlimited lookups."
    : null;

  return (
    <Screen>
      <ScreenHeader title="Log Food" subtitle="Search, quick-add, or log a recipe" back />

      {/* Meal selector */}
      <Txt variant="label" style={{ marginBottom: space.sm }}>
        MEAL
      </Txt>
      <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} />

      <Spacer h={space.lg} />

      {/* Search */}
      <Field
        label="SEARCH FOODS"
        placeholder="e.g. greek yogurt, banana, chicken breast"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
      />

      {searching ? (
        <>
          <Spacer h={space.md} />
          {loading ? (
            <Card soft>
              <Row gap={10}>
                <Feather name="loader" size={16} color={colors.textMuted} />
                <Txt variant="body" muted>
                  Searching foods…
                </Txt>
              </Row>
            </Card>
          ) : error ? (
            <Card soft>
              <Row gap={10} align="flex-start">
                <Feather name="cloud-off" size={16} color={colors.textMuted} />
                <Txt variant="body" muted style={{ flex: 1 }}>
                  {error} You can still quick-add it below.
                </Txt>
              </Row>
            </Card>
          ) : results.length === 0 ? (
            <Card soft>
              <Row gap={10} align="flex-start">
                <Feather name="search" size={16} color={colors.textMuted} />
                <Txt variant="body" muted style={{ flex: 1 }}>
                  No matches for “{query.trim()}”. Try a different term or quick-add it
                  below.
                </Txt>
              </Row>
            </Card>
          ) : (
            <View style={{ gap: space.sm }}>
              {usdaNote ? (
                <Txt variant="caption" muted>
                  {usdaNote}
                </Txt>
              ) : null}
              {results.map((f) => (
                <FoodRow key={f.id} food={f} tone="carbs" onPress={() => openServings(f)} />
              ))}
            </View>
          )}
        </>
      ) : null}

      <Spacer h={space.xl} />

      {/* Quick add */}
      <Card>
        <Row justify="space-between" align="center">
          <View style={{ flex: 1 }}>
            <Txt variant="heading">Quick add</Txt>
            <Txt variant="caption" muted>
              Enter macros by hand when you can’t find it.
            </Txt>
          </View>
          <Button
            title="Add"
            icon="edit-3"
            size="sm"
            variant="ghost"
            onPress={() => {
              tap();
              setQuickOpen(true);
            }}
          />
        </Row>
      </Card>

      <Spacer h={space.xl} />

      {/* Log a Waivy recipe */}
      <Card soft>
        <Row justify="space-between" align="center">
          <View style={{ flex: 1 }}>
            <Txt variant="heading">Log a Waivy recipe</Txt>
            <Txt variant="caption" muted>
              Drop a saved or catalog recipe in as one serving.
            </Txt>
          </View>
          <Button
            title="Browse"
            icon="book-open"
            size="sm"
            variant="accent"
            accentKey="saved"
            onPress={() => {
              tap();
              setRecipeOpen(true);
            }}
          />
        </Row>
      </Card>

      <Spacer h={space.xl} />

      {/* Recent foods */}
      <SectionHeading title="Recent foods" />
      {recent.length === 0 ? (
        <EmptyState
          emoji="🕓"
          title="Nothing logged yet"
          subtitle="Foods you log will show up here for one-tap re-logging."
        />
      ) : (
        <View style={{ gap: space.sm }}>
          {recent.map((f) => (
            <FoodRow key={f.id} food={f} onPress={() => openServings(f)} />
          ))}
        </View>
      )}

      <Spacer h={space.xl} />

      {/* Custom foods */}
      <SectionHeading title="Your custom foods" />
      {customFoods.length === 0 ? (
        <EmptyState
          emoji="🥣"
          title="No custom foods yet"
          subtitle="Quick-add a food and tick “Save to my foods” to keep it here."
        />
      ) : (
        <View style={{ gap: space.sm }}>
          {customFoods.map((f) => (
            <FoodRow key={f.id} food={f} tone="protein" onPress={() => openServings(f)} />
          ))}
        </View>
      )}

      {/* ── Servings stepper ─────────────────────────────────────────────────── */}
      <Sheet
        visible={pending != null}
        onClose={() => setPending(null)}
        title="How much?"
        scroll={false}
      >
        {pending ? (
          <View style={{ paddingHorizontal: space.lg, gap: space.lg }}>
            <View>
              <Txt variant="subheading" numberOfLines={2}>
                {pending.name}
              </Txt>
              <Txt variant="caption" muted>
                {pending.servingDescription} · {macroLine(pending)}
              </Txt>
            </View>

            <Row justify="center" gap={space.xl} style={{ paddingVertical: space.md }}>
              <Press
                haptic="selection"
                onPress={() => setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 2) / 2))}
                style={stepperBtn}
              >
                <Feather name="minus" size={22} color={colors.text} />
              </Press>
              <View style={{ alignItems: "center", minWidth: 96 }}>
                <Txt variant="display">{servings % 1 === 0 ? servings : servings.toFixed(1)}</Txt>
                <Txt variant="caption" muted>
                  serving{servings === 1 ? "" : "s"}
                </Txt>
              </View>
              <Press
                haptic="selection"
                onPress={() => setServings((s) => Math.min(20, Math.round((s + 0.5) * 2) / 2))}
                style={stepperBtn}
              >
                <Feather name="plus" size={22} color={colors.text} />
              </Press>
            </Row>

            <Card soft padded>
              <Row justify="space-between">
                <Txt variant="label">Total</Txt>
                <Txt variant="subheading" color={accent.nourish.shadow}>
                  {Math.round(pending.kcal * servings)} cal ·{" "}
                  {Math.round(pending.proteinG * servings)}g protein
                </Txt>
              </Row>
            </Card>

            <Button title="Log it" icon="check" full onPress={confirmLog} />
            <Spacer h={space.xs} />
          </View>
        ) : null}
      </Sheet>

      {/* ── Quick add sheet ──────────────────────────────────────────────────── */}
      <Sheet visible={quickOpen} onClose={() => setQuickOpen(false)} title="Quick add">
        <Field
          label="NAME"
          placeholder="e.g. Homemade smoothie"
          value={qName}
          onChangeText={setQName}
          autoFocus
        />
        <Field
          label="CALORIES"
          placeholder="kcal per serving"
          value={qKcal}
          onChangeText={setQKcal}
          keyboardType="numeric"
        />
        <Row gap={space.md} align="flex-start">
          <View style={{ flex: 1 }}>
            <Field
              label="PROTEIN (g)"
              placeholder="0"
              value={qProtein}
              onChangeText={setQProtein}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="CARBS (g)"
              placeholder="0"
              value={qCarb}
              onChangeText={setQCarb}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="FAT (g)"
              placeholder="0"
              value={qFat}
              onChangeText={setQFat}
              keyboardType="numeric"
            />
          </View>
        </Row>

        <Press
          haptic="selection"
          onPress={() => setQSave((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: space.sm,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: qSave ? colors.basil : colors.border,
              backgroundColor: qSave ? colors.basil : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {qSave ? <Feather name="check" size={15} color="#fff" /> : null}
          </View>
          <Txt variant="body">Save to my foods</Txt>
        </Press>

        <Button title="Continue" icon="arrow-right" full onPress={submitQuick} />
      </Sheet>

      {/* ── Recipe picker sheet ──────────────────────────────────────────────── */}
      <Sheet visible={recipeOpen} onClose={() => setRecipeOpen(false)} title="Log a recipe">
        {recipeList.length === 0 ? (
          <EmptyState
            emoji="📒"
            title="No recipes to log"
            subtitle="Save a recipe or browse the catalog to log it as a meal."
          />
        ) : (
          recipeList.map((v) => {
            const isSaved = savedViews.some((s) => s.id === v.id);
            return (
              <Press key={v.id} onPress={() => logRecipe(v)} scaleTo={0.98} style={rowStyle}>
                <Txt style={{ fontSize: 30 }}>{v.emoji}</Txt>
                <View style={{ flex: 1, gap: 4 }}>
                  <Row gap={6} align="center">
                    <Txt variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {v.name}
                    </Txt>
                    {isSaved ? <Badge label="Saved" tone="saved" icon="bookmark" /> : null}
                  </Row>
                  <Txt variant="caption" color={accent.nourish.shadow} weight="700">
                    {Math.round(v.nutrition.calories)} cal ·{" "}
                    {Math.round(v.nutrition.protein)}P · {Math.round(v.nutrition.carbs)}C ·{" "}
                    {Math.round(v.nutrition.fat)}F
                  </Txt>
                </View>
                <Feather name="plus-circle" size={22} color={colors.basil} />
              </Press>
            );
          })
        )}
      </Sheet>
    </Screen>
  );
}

const stepperBtn = {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: colors.oat,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderWidth: 1,
  borderColor: colors.border,
};
