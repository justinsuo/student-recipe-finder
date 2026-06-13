import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "~/components/Screen";
import { Txt, Row, Card, Button, Field, Press, Badge, Pill, SegmentedControl, EmptyState, SectionHeading, Divider } from "~/components/ui";
import { toast } from "~/components/Toast";
import { colors, space, radius, accent } from "~/theme";
import { usePantry, useGrocery } from "~/lib/stores/app";
import { logFood } from "~/lib/stores/nourish";
import { ingredientLabel } from "~/lib/recipes";
import {
  aiAvailable, aiMode, generateOptions, refine, persistGenerated, generateAndStoreImage,
  type GeneratedRecipe, type GeneratedRecipeOptionSet,
} from "~/lib/ai";
import { tap } from "~/lib/haptics";
import type { FoodItem, MealSlot } from "@/lib/nourish/types";

const EQUIPMENT = ["microwave", "stovetop", "oven", "air-fryer", "rice-cooker", "no-kitchen"] as const;
const DIET = ["vegetarian", "vegan", "high-protein", "gluten-free", "dairy-free"] as const;
const BUDGETS = [3, 5, 8, 0];
const OPTION_TONE: Record<string, any> = { "best-match": "pantry", cheapest: "cheap", fastest: "nourish", wildcard: "ai-chef" };

function mealSlotNow(): MealSlot {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export default function AiChefScreen() {
  const { pantry } = usePantry();
  const grocery = useGrocery();

  const [usePantryItems, setUsePantryItems] = useState(true);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState(5);
  const [servings, setServings] = useState(1);
  const [equipment, setEquipment] = useState<Set<string>>(new Set(["stovetop", "microwave"]));
  const [diet, setDiet] = useState<Set<string>>(new Set());
  const [creativity, setCreativity] = useState<"practical" | "balanced" | "creative">("balanced");

  const [loading, setLoading] = useState(false);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedRecipeOptionSet | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, string>>({});

  const selectedPantryIds = useMemo(
    () => (usePantryItems ? pantry.map((p) => p.ingredientId).filter((id) => !excluded.has(id)) : []),
    [usePantryItems, pantry, excluded],
  );
  const selectedOption = results?.options.find((o) => o.id === selectedId);

  function toggle(set: Set<string>, val: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
    tap();
  }

  async function generate() {
    setLoading(true);
    setResults(null);
    try {
      const set = await generateOptions({
        pantryIngredients: selectedPantryIds.map(ingredientLabel),
        selectedPantryIngredientIds: selectedPantryIds,
        cravingText: notes,
        aiNotes: notes,
        budgetPerServing: budget || undefined,
        servings,
        equipment: Array.from(equipment),
        dietTags: Array.from(diet),
        creativityLevel: creativity,
      });
      setResults(set);
      setSelectedId(set.mainOptionId || set.options[0]?.id || null);
      toast("4 recipes ready 🍳", "reward");
    } catch (e: any) {
      toast(e?.message?.includes("offline") ? "AI Chef is offline" : "Generation failed — try again", "error");
    } finally {
      setLoading(false);
    }
  }

  function ensureSaved(optId: string, recipe: GeneratedRecipe): string {
    if (savedIds[optId]) return savedIds[optId];
    const custom = persistGenerated(recipe);
    setSavedIds((s) => ({ ...s, [optId]: custom.id }));
    generateAndStoreImage(custom.id, recipe);
    return custom.id;
  }

  function onSave(optId: string, recipe: GeneratedRecipe) {
    ensureSaved(optId, recipe);
    toast("Saved to Recipe Studio", "reward");
  }

  function onAddMissing(recipe: GeneratedRecipe) {
    const names = (recipe.missingIngredients ?? []).map((m) => m.name);
    if (names.length === 0) { toast("Nothing missing — you have it all!", "info"); return; }
    grocery.addNames(names, recipe.name);
    toast(`Added ${names.length} item${names.length === 1 ? "" : "s"} to grocery`);
  }

  function onLog(recipe: GeneratedRecipe) {
    const n = recipe.estimatedNutrition;
    const food: FoodItem = {
      id: `recipe-${Date.now().toString(36)}`,
      source: "recipe",
      name: recipe.name,
      servingDescription: "1 serving",
      kcal: n.calories, proteinG: n.protein, carbG: n.carbs, fatG: n.fat, fiberG: n.fiber,
    };
    logFood(food, mealSlotNow(), 1);
    toast(`Logged to Nourish (${Math.round(n.calories)} cal)`, "reward");
  }

  async function onRefine(optId: string, recipe: GeneratedRecipe, request: string) {
    setRefiningId(optId);
    try {
      const refined = await refine(recipe, request, {
        pantryIngredients: selectedPantryIds.map(ingredientLabel),
        budgetPerServing: budget || undefined, servings,
        equipment: Array.from(equipment), dietTags: Array.from(diet),
      });
      setResults((prev) => prev ? { ...prev, options: prev.options.map((o) => o.id === optId ? { ...o, recipe: refined } : o) } : prev);
      setSavedIds((s) => { const n = { ...s }; delete n[optId]; return n; });
      toast("Recipe updated ✨");
    } catch {
      toast("Couldn't refine — try again", "error");
    } finally {
      setRefiningId(null);
    }
  }

  const mode = aiMode();

  return (
    <Screen>
      <Row justify="space-between" style={{ marginBottom: space.lg }}>
        <View>
          <Txt variant="label">AI CHEF</Txt>
          <Txt variant="title">Cook something custom</Txt>
        </View>
        <Badge
          label={mode === "worker" ? "Secure AI" : mode === "haiku" ? "Fast AI" : "On-device"}
          tone="ai-chef"
          icon={mode === "local" ? "cpu" : "shield"}
        />
      </Row>

      {mode === "local" ? (
        <Press onPress={() => router.push("/settings")}>
          <Card soft style={{ marginBottom: space.md }}>
            <Row gap={10}>
              <Feather name="zap" size={18} color={accent["ai-chef"].shadow} />
              <Txt variant="caption" muted style={{ flex: 1 }}>
                Building recipes on-device from your pantry + Waivy's 229-recipe catalog with real cost & macros. Add a Worker URL in <Txt weight="700" color={accent["ai-chef"].shadow}>Settings</Txt> for AI-generated originals.
              </Txt>
            </Row>
          </Card>
        </Press>
      ) : null}

      <Card style={{ gap: 12, marginBottom: space.md }}>
        <Press onPress={() => { setUsePantryItems((v) => !v); tap(); }}>
          <Row justify="space-between">
            <Row gap={10}><Feather name="archive" size={18} color={colors.basil} /><Txt variant="subheading">Use my pantry</Txt></Row>
            <View style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: usePantryItems ? colors.basil : colors.borderSoft, justifyContent: "center", padding: 3 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: usePantryItems ? "flex-end" : "flex-start" }} />
            </View>
          </Row>
        </Press>
        {usePantryItems && pantry.length > 0 ? (
          <Row gap={8} wrap>
            {pantry.map((p) => {
              const on = !excluded.has(p.ingredientId);
              return <Pill key={p.ingredientId} label={ingredientLabel(p.ingredientId)} tone="pantry" selected={on}
                onPress={() => { const n = new Set(excluded); on ? n.add(p.ingredientId) : n.delete(p.ingredientId); setExcluded(n); }} />;
            })}
          </Row>
        ) : usePantryItems ? <Txt variant="caption" muted>Your pantry is empty — add items or describe what you have below.</Txt> : null}
      </Card>

      <Field label="Notes / cravings" placeholder="e.g. something spicy and high-protein, under 20 min" value={notes} onChangeText={setNotes} style={{ marginBottom: space.md }} />

      <Row gap={space.md} style={{ marginBottom: space.md }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt variant="label">Budget / serving</Txt>
          <Row gap={6} wrap>
            {BUDGETS.map((b) => <Pill key={b} label={b ? `$${b}` : "Any"} tone="cheap" selected={budget === b} onPress={() => setBudget(b)} />)}
          </Row>
        </View>
        <View style={{ gap: 6 }}>
          <Txt variant="label">Servings</Txt>
          <Row gap={8}>
            <Press onPress={() => setServings((s) => Math.max(1, s - 1))} style={stepBtn}><Feather name="minus" size={16} color={colors.text} /></Press>
            <Txt variant="heading" style={{ minWidth: 22, textAlign: "center" }}>{servings}</Txt>
            <Press onPress={() => setServings((s) => Math.min(8, s + 1))} style={stepBtn}><Feather name="plus" size={16} color={colors.text} /></Press>
          </Row>
        </View>
      </Row>

      <Txt variant="label" style={{ marginBottom: 6 }}>Equipment</Txt>
      <Row gap={8} wrap style={{ marginBottom: space.md }}>
        {EQUIPMENT.map((e) => <Pill key={e} label={e.replace("-", " ")} tone="grocery" selected={equipment.has(e)} onPress={() => toggle(equipment, e, setEquipment)} />)}
      </Row>

      <Txt variant="label" style={{ marginBottom: 6 }}>Diet</Txt>
      <Row gap={8} wrap style={{ marginBottom: space.md }}>
        {DIET.map((d) => <Pill key={d} label={d.replace("-", " ")} tone="ai-chef" selected={diet.has(d)} onPress={() => toggle(diet, d, setDiet)} />)}
      </Row>

      <Txt variant="label" style={{ marginBottom: 6 }}>Creativity</Txt>
      <SegmentedControl value={creativity} onChange={setCreativity}
        options={[{ label: "Practical", value: "practical" }, { label: "Balanced", value: "balanced" }, { label: "Creative", value: "creative" }]} />

      <Button title={loading ? "Cooking up ideas…" : "Generate recipes"} icon="zap" accentKey="ai-chef" variant="accent" full loading={loading}
        style={{ marginTop: space.lg }} onPress={generate} />

      {results ? (
        <View style={{ marginTop: space.xl }}>
          <SectionHeading title="Your options" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -space.lg, paddingHorizontal: space.lg, marginBottom: space.md }}>
            {results.options.map((o) => (
              <Press key={o.id} onPress={() => setSelectedId(o.id)} scaleTo={0.97}
                style={{ width: 150, padding: 12, borderRadius: radius.lg, borderWidth: 2, borderColor: o.id === selectedId ? accent[OPTION_TONE[o.optionLabel] ?? "ai-chef"].main : colors.border, backgroundColor: o.id === selectedId ? accent[OPTION_TONE[o.optionLabel] ?? "ai-chef"].tint : colors.surface, gap: 6 }}>
                <Badge label={o.optionLabel.replace("-", " ")} tone={OPTION_TONE[o.optionLabel] ?? "ai-chef"} />
                <Txt variant="subheading" numberOfLines={2}>{o.recipe.name}</Txt>
                <Txt variant="caption" muted numberOfLines={2}>{o.shortReason}</Txt>
                <Row gap={6}><Txt variant="caption" weight="700" color={colors.basilShadow}>${o.recipe.estimatedCostPerServing.toFixed(2)}</Txt><Txt variant="caption" muted>· {o.recipe.totalTimeMinutes}m</Txt></Row>
              </Press>
            ))}
          </ScrollView>

          {selectedOption ? <ResultPanel
            option={selectedOption}
            saved={!!savedIds[selectedOption.id]}
            refining={refiningId === selectedOption.id}
            onSave={() => onSave(selectedOption.id, selectedOption.recipe)}
            onAddMissing={() => onAddMissing(selectedOption.recipe)}
            onLog={() => onLog(selectedOption.recipe)}
            onCook={() => { const id = ensureSaved(selectedOption.id, selectedOption.recipe); router.push(`/cook/${id}`); }}
            onAsk={() => { const id = ensureSaved(selectedOption.id, selectedOption.recipe); router.push(`/chat?recipe=${id}`); }}
            onRefine={(req: string) => onRefine(selectedOption.id, selectedOption.recipe, req)}
          /> : null}
        </View>
      ) : null}
    </Screen>
  );
}

function ResultPanel({ option, saved, refining, onSave, onAddMissing, onLog, onCook, onAsk, onRefine }: any) {
  const r: GeneratedRecipe = option.recipe;
  const n = r.estimatedNutrition;
  return (
    <Card style={{ gap: 14 }}>
      <View>
        <Txt variant="heading">{r.name}</Txt>
        {r.whyThisFits ? <Txt variant="caption" muted style={{ marginTop: 2 }}>{r.whyThisFits}</Txt> : null}
      </View>
      <Row gap={6} wrap>
        <Badge label={`$${r.estimatedCostPerServing.toFixed(2)}/serving`} tone="cheap" icon="dollar-sign" />
        <Badge label={`${Math.round(n.calories)} cal`} tone="nourish" icon="zap" />
        <Badge label={`${Math.round(n.protein)}g protein`} tone="ai-chef" />
        <Badge label={`${r.totalTimeMinutes} min`} tone="grocery" icon="clock" />
      </Row>

      <View>
        <Txt variant="label" style={{ marginBottom: 6 }}>INGREDIENTS</Txt>
        {r.ingredients.map((i, idx) => (
          <Row key={idx} justify="space-between" style={{ paddingVertical: 5 }}>
            <Row gap={8} style={{ flex: 1 }}>
              <Feather name={i.userAlreadyHas ? "check-circle" : "circle"} size={15} color={i.userAlreadyHas ? colors.basil : colors.textFaint} />
              <Txt variant="body" style={{ flex: 1 }}>{i.quantity} {i.unit} {i.name}{i.optional ? " (optional)" : ""}</Txt>
            </Row>
            <Txt variant="caption" muted>${(i.estimatedCost ?? 0).toFixed(2)}</Txt>
          </Row>
        ))}
      </View>

      {r.missingIngredients?.length ? (
        <View style={{ backgroundColor: accent.cheap.tint, borderRadius: radius.md, padding: 12 }}>
          <Txt variant="label" style={{ marginBottom: 4 }}>YOU'LL NEED TO BUY</Txt>
          <Txt variant="caption" muted>{r.missingIngredients.map((m) => m.name).join(", ")}</Txt>
        </View>
      ) : null}

      <View>
        <Txt variant="label" style={{ marginBottom: 6 }}>STEPS</Txt>
        {r.steps.map((s, idx) => (
          <Row key={idx} gap={10} align="flex-start" style={{ paddingVertical: 5 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: accent["ai-chef"].tint, alignItems: "center", justifyContent: "center" }}>
              <Txt variant="caption" weight="700" color={accent["ai-chef"].shadow}>{idx + 1}</Txt>
            </View>
            <Txt variant="body" style={{ flex: 1 }}>{s}</Txt>
          </Row>
        ))}
      </View>

      {r.cheapTips?.length ? (
        <View>
          <Txt variant="label" style={{ marginBottom: 4 }}>💡 CHEAP TIPS</Txt>
          {r.cheapTips.slice(0, 3).map((t, i) => <Txt key={i} variant="caption" muted style={{ paddingVertical: 2 }}>• {t}</Txt>)}
        </View>
      ) : null}

      <Divider />
      <Txt variant="label">REFINE</Txt>
      <Row gap={8} wrap>
        {[["Make it cheaper", "make it cheaper"], ["Higher protein", "make it higher protein"], ["Faster", "make it faster"], ["Fewer missing", "use fewer ingredients I don't have"]].map(([label, req]) => (
          <Pill key={label} label={label} tone="grocery" onPress={() => onRefine(req)} />
        ))}
      </Row>
      {refining ? <Txt variant="caption" muted center>Refining…</Txt> : null}

      <Divider />
      <Row gap={10}>
        <Button title="Start cooking" icon="play" accentKey="ai-chef" variant="accent" style={{ flex: 1 }} onPress={onCook} />
        <Button title={saved ? "Saved ✓" : "Save"} icon="bookmark" variant="secondary" style={{ flex: 1 }} onPress={onSave} />
      </Row>
      <Row gap={10}>
        <Button title="Add to grocery" icon="shopping-cart" variant="secondary" size="sm" style={{ flex: 1 }} onPress={onAddMissing} />
        <Button title="Log to Nourish" icon="heart" variant="secondary" size="sm" style={{ flex: 1 }} onPress={onLog} />
      </Row>
      <Button title="Ask AI Chef about this recipe" icon="message-circle" variant="ghost" full onPress={onAsk} />
    </Card>
  );
}

const stepBtn = { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.oat, alignItems: "center" as const, justifyContent: "center" as const };
