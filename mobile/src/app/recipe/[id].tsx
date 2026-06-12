import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "~/components/Screen";
import { Txt, Row, Card, Button, Press, Badge, IconButton, EmptyState, Divider } from "~/components/ui";
import { MacroBar } from "~/components/Charts";
import { toast } from "~/components/Toast";
import { colors, space, radius, accent } from "~/theme";
import { getSeedRecipe, getCustom, getAnyView, ingredientLabel } from "~/lib/recipes";
import { useSaved, usePantry, useGrocery } from "~/lib/stores/app";
import { logRecipeAsMeal } from "~/lib/actions";
import {
  calculateCostPerServing, ingredientCostBreakdown, pantrySetFromItems, calculateMissingIngredients,
} from "@/lib/recipeScoring";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { useTargets } from "~/lib/stores/nourish";
import type { NutritionEstimate } from "@/lib/types";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipeId = decodeURIComponent(String(id));
  const { isSaved, toggleSaved } = useSaved();
  const { pantry } = usePantry();
  const grocery = useGrocery();
  const targets = useTargets();

  const seed = getSeedRecipe(recipeId);
  const custom = seed ? undefined : getCustom(recipeId);
  const view = getAnyView(recipeId);

  const data = useMemo(() => {
    if (seed) {
      const pantrySet = pantrySetFromItems(pantry);
      const breakdown = ingredientCostBreakdown(seed);
      const missing = calculateMissingIngredients(seed, pantrySet);
      const nutrition = bestEffortNutrition(seed).estimate;
      return {
        name: seed.name, description: seed.description, servings: seed.servings,
        time: seed.totalTimeMinutes, cost: calculateCostPerServing(seed),
        equipment: seed.equipment as string[], diet: seed.dietTags as string[],
        ingredients: breakdown.map((b) => ({
          label: b.ingredient ? b.ingredient.name : "?",
          detail: `${b.quantity} ${b.ingredient?.unit ?? ""}`.trim(),
          cost: b.cost, have: pantrySet.has(b.ingredient?.id ?? ""), optional: b.optional,
        })),
        steps: seed.steps,
        nutrition, tips: seed.cheapTips ?? [],
        storage: seed.storageInstructions, reheat: seed.reheatingInstructions,
        missingIds: missing.map((m) => m.ingredientId),
        missingNames: missing.map((m) => ingredientLabel(m.ingredientId)),
      };
    }
    if (custom) {
      const nutrition: NutritionEstimate = custom.estimatedNutrition
        ? { calories: custom.estimatedNutrition.calories, protein: custom.estimatedNutrition.protein, carbs: custom.estimatedNutrition.carbs, fat: custom.estimatedNutrition.fat, fiber: custom.estimatedNutrition.fiber }
        : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const missingNames = custom.ingredients.filter((i) => !i.userAlreadyHas).map((i) => i.name);
      return {
        name: custom.name, description: custom.description, servings: custom.servings,
        time: custom.totalTimeMinutes, cost: custom.estimatedCostPerServing,
        equipment: custom.equipment ?? [], diet: custom.tags ?? [],
        ingredients: custom.ingredients.map((i) => ({
          label: i.name, detail: `${i.quantity} ${i.unit}`.trim(), cost: i.estimatedCost, have: !!i.userAlreadyHas, optional: !!i.optional,
        })),
        steps: custom.steps,
        nutrition, tips: custom.cheapTips ?? custom.studentTips ?? [],
        storage: custom.storageInstructions, reheat: custom.reheatingInstructions,
        missingIds: [] as string[], missingNames,
      };
    }
    return null;
  }, [recipeId, pantry]);

  if (!data || !view) {
    return <Screen><EmptyState emoji="🤷" title="Recipe not found" subtitle="It may have been deleted." action={<Button title="Go back" onPress={() => router.back()} />} /></Screen>;
  }

  const saved = isSaved(recipeId);
  const a = accent[view.accent];

  function addToGrocery() {
    if (seed && data.missingIds.length) grocery.addRecipeMissing(seed, data.missingIds);
    else if (data.missingNames.length) grocery.addNames(data.missingNames, recipeId);
    else { toast("You have everything already 🎉", "info"); return; }
    toast(`Added ${data.missingNames.length} item${data.missingNames.length === 1 ? "" : "s"} to grocery`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen padded={false}>
        {/* Hero image */}
        <View style={{ height: 280 }}>
          {view.imageUri ? (
            <Image source={{ uri: view.imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={[a.tint, a.main]} style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
              <Txt style={{ fontSize: 96 }}>{view.emoji}</Txt>
            </LinearGradient>
          )}
          <LinearGradient colors={["rgba(0,0,0,0.35)", "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120 }} />
          <Row justify="space-between" style={{ position: "absolute", top: insets.top + 6, left: space.lg, right: space.lg }}>
            <IconButton icon="chevron-left" onPress={() => router.back()} bg="rgba(255,255,255,0.92)" />
            <IconButton icon="bookmark" onPress={() => { toggleSaved(recipeId); toast(saved ? "Removed" : "Saved", saved ? "info" : "success"); }} bg="rgba(255,255,255,0.92)" color={saved ? colors.pink : colors.text} />
          </Row>
        </View>

        <View style={{ padding: space.lg, gap: space.lg }}>
          <View style={{ gap: 6 }}>
            <Txt variant="title">{data.name}</Txt>
            <Txt variant="body" muted>{data.description}</Txt>
          </View>

          <Row gap={6} wrap>
            <Badge label={`$${data.cost.toFixed(2)}/serving`} tone="cheap" icon="dollar-sign" />
            <Badge label={`${data.time} min`} tone="grocery" icon="clock" />
            <Badge label={`${Math.round(data.nutrition.calories)} cal`} tone="nourish" icon="zap" />
            <Badge label={`${data.servings} serving${data.servings === 1 ? "" : "s"}`} tone="pantry" icon="users" />
          </Row>

          {/* Primary actions */}
          <Row gap={10}>
            <Button title="Start cooking" icon="play" accentKey="ai-chef" variant="accent" style={{ flex: 1 }} onPress={() => router.push(`/cook/${encodeURIComponent(recipeId)}`)} />
            <Button title="Ask AI Chef" icon="message-circle" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(`/chat?recipe=${encodeURIComponent(recipeId)}`)} />
          </Row>

          {/* Ingredients */}
          <Card>
            <Row justify="space-between" style={{ marginBottom: 6 }}>
              <Txt variant="subheading">Ingredients</Txt>
              {data.missingNames.length ? <Press onPress={addToGrocery} haptic="selection"><Txt variant="label" color={colors.basilShadow}>+ Grocery</Txt></Press> : null}
            </Row>
            {data.ingredients.map((i, idx) => (
              <Row key={idx} justify="space-between" style={{ paddingVertical: 6 }}>
                <Row gap={8} style={{ flex: 1 }}>
                  <Feather name={i.have ? "check-circle" : "circle"} size={15} color={i.have ? colors.basil : colors.textFaint} />
                  <Txt variant="body" style={{ flex: 1 }}>
                    <Txt weight="600">{i.detail}</Txt> {i.label}{i.optional ? <Txt muted> · optional</Txt> : null}
                  </Txt>
                </Row>
                <Txt variant="caption" muted>${(i.cost ?? 0).toFixed(2)}</Txt>
              </Row>
            ))}
          </Card>

          {/* Steps */}
          <View>
            <Txt variant="subheading" style={{ marginBottom: 10 }}>Steps</Txt>
            {data.steps.map((s, idx) => (
              <Row key={idx} gap={12} align="flex-start" style={{ marginBottom: 14 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent["ai-chef"].tint, alignItems: "center", justifyContent: "center" }}>
                  <Txt variant="caption" weight="700" color={accent["ai-chef"].shadow}>{idx + 1}</Txt>
                </View>
                <Txt variant="body" style={{ flex: 1, lineHeight: 22 }}>{s}</Txt>
              </Row>
            ))}
          </View>

          {/* Nutrition */}
          <Card style={{ gap: 12 }}>
            <Txt variant="subheading">Nutrition · per serving</Txt>
            <Row gap={14}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Txt variant="title" color={colors.carrot}>{Math.round(data.nutrition.calories)}</Txt>
                <Txt variant="caption" muted>calories</Txt>
              </View>
              <View style={{ flex: 2, gap: 10 }}>
                <MacroBar label="Protein" value={data.nutrition.protein} target={targets.proteinG} color={colors.grape} />
                <MacroBar label="Carbs" value={data.nutrition.carbs} target={targets.carbG} color={colors.sky} />
                <MacroBar label="Fat" value={data.nutrition.fat} target={targets.fatG} color={colors.butter} />
              </View>
            </Row>
            <Button title="Log to Nourish" icon="heart" variant="secondary" full onPress={() => { const c = logRecipeAsMeal(data.name, data.nutrition, recipeId); toast(`Logged ${c} cal to Nourish`, "reward"); }} />
          </Card>

          {/* Tips */}
          {data.tips.length ? (
            <Card soft>
              <Txt variant="subheading" style={{ marginBottom: 6 }}>💡 Tips</Txt>
              {data.tips.slice(0, 5).map((t, i) => <Txt key={i} variant="body" muted style={{ paddingVertical: 3 }}>• {t}</Txt>)}
            </Card>
          ) : null}

          {data.storage || data.reheat ? (
            <Card>
              {data.storage ? <><Txt variant="label">STORAGE</Txt><Txt variant="body" muted style={{ marginBottom: 8 }}>{data.storage}</Txt></> : null}
              {data.reheat ? <><Txt variant="label">REHEATING</Txt><Txt variant="body" muted>{data.reheat}</Txt></> : null}
            </Card>
          ) : null}
        </View>
      </Screen>
    </View>
  );
}
