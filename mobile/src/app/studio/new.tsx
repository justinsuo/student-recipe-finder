/**
 * Manual Recipe Builder — a 3-step guided flow (basics → ingredients → method).
 * Builds a real UserCreatedRecipe via the shared customRecipeStorage engine and
 * computes a live nutrition preview from the shared nutritionEngine, exactly
 * like the web Recipe Studio. Saves, then drops you on the recipe detail page.
 */
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Screen, ScreenHeader } from "~/components/Screen";
import {
  Txt,
  Row,
  Spacer,
  Divider,
  Card,
  Press,
  Button,
  IconButton,
  Badge,
  Pill,
  Field,
  EmptyState,
  SectionHeading,
} from "~/components/ui";
import { MacroBar } from "~/components/Charts";
import { toast } from "~/components/Toast";
import { tap, success } from "~/lib/haptics";
import { colors, space, radius, accent } from "~/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  emptyUserRecipe,
  saveCustomRecipe,
  makeCustomRecipeId,
  fallbackImageMeta,
} from "@/lib/customRecipeStorage";
import { calculateNutritionForFreeForm } from "@/lib/nutritionEngine";
import type {
  UserCreatedRecipe,
  CustomRecipeIngredient,
} from "@/lib/customRecipeTypes";

type MealType = UserCreatedRecipe["mealType"];

const MEAL_TYPES: { label: string; value: MealType; emoji: string }[] = [
  { label: "Breakfast", value: "breakfast", emoji: "🍳" },
  { label: "Lunch", value: "lunch", emoji: "🥪" },
  { label: "Dinner", value: "dinner", emoji: "🍝" },
  { label: "Snack", value: "snack", emoji: "🍎" },
  { label: "Meal prep", value: "meal-prep", emoji: "🥡" },
];

const STEP_LABELS = ["Basics", "Ingredients", "Method"];

interface DraftIngredient {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  estimatedCost: string;
}

let _rowSeq = 0;
function makeRow(): DraftIngredient {
  _rowSeq += 1;
  return { key: `ing-${_rowSeq}`, name: "", quantity: "1", unit: "", estimatedCost: "" };
}
function makeInstruction(): { key: string; text: string } {
  _rowSeq += 1;
  return { key: `step-${_rowSeq}`, text: "" };
}

function numOr(value: string, fallback = 0): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function StudioNew() {
  const [step, setStep] = useState(0);

  // Step 1 — basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState(2);
  const [totalTime, setTotalTime] = useState("");
  const [mealType, setMealType] = useState<MealType>("dinner");

  // Step 2 — ingredients
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([makeRow()]);

  // Step 3 — instructions
  const [instructions, setInstructions] = useState([makeInstruction()]);

  const [saving, setSaving] = useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────
  const validIngredients = useMemo(
    () => ingredients.filter((i) => i.name.trim().length > 0),
    [ingredients],
  );

  const totalCost = useMemo(
    () => ingredients.reduce((sum, i) => sum + numOr(i.estimatedCost), 0),
    [ingredients],
  );
  const costPerServing = servings > 0 ? totalCost / servings : 0;

  const nutrition = useMemo(
    () =>
      calculateNutritionForFreeForm(
        validIngredients.map((i) => ({
          name: i.name.trim(),
          quantity: numOr(i.quantity, 0),
          unit: i.unit.trim(),
        })),
        servings,
      ),
    [validIngredients, servings],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  function updateIngredient(key: string, patch: Partial<DraftIngredient>) {
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function addIngredientRow() {
    tap();
    setIngredients((prev) => [...prev, makeRow()]);
  }
  function removeIngredientRow(key: string) {
    tap();
    setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)));
  }

  function updateInstruction(key: string, text: string) {
    setInstructions((prev) => prev.map((s) => (s.key === key ? { ...s, text } : s)));
  }
  function addInstructionRow() {
    tap();
    setInstructions((prev) => [...prev, makeInstruction()]);
  }
  function removeInstructionRow(key: string) {
    tap();
    setInstructions((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.key !== key)));
  }

  // ── Navigation between steps ───────────────────────────────────────────────
  function goNext() {
    if (step === 0 && !name.trim()) {
      toast("Give your recipe a name first", "error");
      return;
    }
    tap();
    setStep((s) => Math.min(2, s + 1));
  }
  function goBack() {
    tap();
    setStep((s) => Math.max(0, s - 1));
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!name.trim()) {
      toast("Give your recipe a name first", "error");
      setStep(0);
      return;
    }
    if (validIngredients.length === 0) {
      toast("Add at least one ingredient", "error");
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const cleanIngredients: CustomRecipeIngredient[] = validIngredients.map((i) => ({
        name: i.name.trim(),
        quantity: numOr(i.quantity, 0),
        unit: i.unit.trim(),
        estimatedCost: numOr(i.estimatedCost, 0),
      }));
      const steps = instructions
        .map((s) => s.text.trim())
        .filter((t) => t.length > 0);

      const draft = emptyUserRecipe();
      const recipe: UserCreatedRecipe = {
        ...draft,
        id: makeCustomRecipeId(name, "user"),
        name: name.trim(),
        description: description.trim(),
        mealType,
        servings,
        totalTimeMinutes: numOr(totalTime, 0),
        ingredients: cleanIngredients,
        steps,
        estimatedTotalCost: Number(totalCost.toFixed(2)),
        estimatedCostPerServing: Number(costPerServing.toFixed(2)),
        estimatedNutrition: {
          calories: nutrition.perServing.calories,
          protein: nutrition.perServing.protein,
          carbs: nutrition.perServing.carbs,
          fat: nutrition.perServing.fat,
          ...(nutrition.perServing.fiber !== undefined
            ? { fiber: nutrition.perServing.fiber }
            : {}),
        },
        image: fallbackImageMeta(),
        createdAt: now,
        updatedAt: now,
        isAIGenerated: false,
        isUserCreated: true,
      };

      saveCustomRecipe(recipe);
      success();
      toast("Recipe saved!", "success");
      router.replace(`/recipe/${encodeURIComponent(recipe.id)}`);
    } catch {
      setSaving(false);
      toast("Couldn't save that recipe — try again", "error");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Screen>
      <ScreenHeader title="New Recipe" subtitle="Build it your way" back />

      <StepProgress step={step} onJump={(i) => i <= step && setStep(i)} />
      <Spacer h={space.lg} />

      {step === 0 ? (
        <BasicsStep
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          servings={servings}
          setServings={setServings}
          totalTime={totalTime}
          setTotalTime={setTotalTime}
          mealType={mealType}
          setMealType={setMealType}
        />
      ) : null}

      {step === 1 ? (
        <IngredientsStep
          ingredients={ingredients}
          onUpdate={updateIngredient}
          onAdd={addIngredientRow}
          onRemove={removeIngredientRow}
          totalCost={totalCost}
          costPerServing={costPerServing}
        />
      ) : null}

      {step === 2 ? (
        <MethodStep
          instructions={instructions}
          onUpdate={updateInstruction}
          onAdd={addInstructionRow}
          onRemove={removeInstructionRow}
          nutrition={nutrition}
          servings={servings}
        />
      ) : null}

      <Spacer h={space.xl} />

      <Row gap={space.md}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <Button title="Back" variant="secondary" icon="arrow-left" onPress={goBack} full />
          </View>
        ) : null}
        <View style={{ flex: 2 }}>
          {step < 2 ? (
            <Button title="Continue" variant="primary" icon="arrow-right" onPress={goNext} full />
          ) : (
            <Button
              title="Save recipe"
              variant="primary"
              icon="check"
              onPress={handleSave}
              loading={saving}
              full
            />
          )}
        </View>
      </Row>
      <Spacer h={space.xl} />
    </Screen>
  );
}

// ─── Step progress indicator ───────────────────────────────────────────────────

function StepProgress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <Row gap={space.sm} justify="space-between">
      {STEP_LABELS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <Press
            key={label}
            haptic="selection"
            onPress={() => onJump(i)}
            scaleTo={0.98}
            style={{ flex: 1 }}
          >
            <View style={{ gap: 6 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: radius.pill,
                  backgroundColor: active || done ? colors.basil : colors.oat,
                }}
              />
              <Row gap={5}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: done
                      ? colors.basil
                      : active
                        ? colors.basilSoft
                        : colors.oat,
                  }}
                >
                  {done ? (
                    <Feather name="check" size={11} color="#FFFFFF" />
                  ) : (
                    <Txt
                      variant="caption"
                      color={active ? colors.basilShadow : colors.textFaint}
                      style={{ fontSize: 11, fontWeight: "800" }}
                    >
                      {i + 1}
                    </Txt>
                  )}
                </View>
                <Txt
                  variant="caption"
                  color={active ? colors.text : colors.textFaint}
                  weight={active ? "700" : "500"}
                  numberOfLines={1}
                >
                  {label}
                </Txt>
              </Row>
            </View>
          </Press>
        );
      })}
    </Row>
  );
}

// ─── Step 1: Basics ─────────────────────────────────────────────────────────────

function BasicsStep(props: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  servings: number;
  setServings: (v: number) => void;
  totalTime: string;
  setTotalTime: (v: string) => void;
  mealType: MealType;
  setMealType: (v: MealType) => void;
}) {
  return (
    <Card style={{ gap: space.lg }}>
      <Field
        label="Recipe name"
        placeholder="e.g. Crispy Pantry Fried Rice"
        value={props.name}
        onChangeText={props.setName}
        maxLength={60}
        returnKeyType="next"
      />
      <Field
        label="Description"
        placeholder="A quick note on what makes it good"
        value={props.description}
        onChangeText={props.setDescription}
        multiline
        style={{ minHeight: 76, textAlignVertical: "top" }}
        maxLength={240}
      />

      <View style={{ gap: 8 }}>
        <Txt variant="label">Servings</Txt>
        <Row justify="space-between">
          <Stepper
            value={props.servings}
            min={1}
            max={20}
            onChange={props.setServings}
            suffix={props.servings === 1 ? "serving" : "servings"}
          />
        </Row>
      </View>

      <Field
        label="Total time (minutes)"
        placeholder="e.g. 25"
        value={props.totalTime}
        onChangeText={(t) => props.setTotalTime(t.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        maxLength={4}
      />

      <View style={{ gap: 8 }}>
        <Txt variant="label">Meal type</Txt>
        <Row gap={space.sm} wrap>
          {MEAL_TYPES.map((m) => (
            <Pill
              key={m.value}
              label={`${m.emoji}  ${m.label}`}
              tone="pantry"
              selected={props.mealType === m.value}
              onPress={() => props.setMealType(m.value)}
            />
          ))}
        </Row>
      </View>
    </Card>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <Row gap={space.md} align="center">
      <IconButton
        icon="minus"
        size={44}
        bg={value <= min ? colors.oat : colors.basilSoft}
        color={value <= min ? colors.textFaint : colors.basilShadow}
        onPress={() => value > min && onChange(value - 1)}
      />
      <View style={{ minWidth: 96, alignItems: "center" }}>
        <Txt variant="title">{value}</Txt>
        {suffix ? (
          <Txt variant="caption" muted>
            {suffix}
          </Txt>
        ) : null}
      </View>
      <IconButton
        icon="plus"
        size={44}
        bg={value >= max ? colors.oat : colors.basilSoft}
        color={value >= max ? colors.textFaint : colors.basilShadow}
        onPress={() => value < max && onChange(value + 1)}
      />
    </Row>
  );
}

// ─── Step 2: Ingredients ────────────────────────────────────────────────────────

function IngredientsStep(props: {
  ingredients: DraftIngredient[];
  onUpdate: (key: string, patch: Partial<DraftIngredient>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
  totalCost: number;
  costPerServing: number;
}) {
  const filledCount = props.ingredients.filter((i) => i.name.trim()).length;
  return (
    <View style={{ gap: space.md }}>
      <SectionHeading title="Ingredients" />

      {props.ingredients.map((ing, idx) => (
        <Card key={ing.key} style={{ gap: space.sm }} elevation="sm">
          <Row justify="space-between">
            <Badge label={`Item ${idx + 1}`} tone="grocery" icon="shopping-bag" />
            {props.ingredients.length > 1 ? (
              <IconButton
                icon="trash-2"
                size={34}
                iconSize={16}
                bg={colors.tomatoTint}
                color={colors.tomatoShadow}
                onPress={() => props.onRemove(ing.key)}
              />
            ) : null}
          </Row>
          <Field
            placeholder="Ingredient name (e.g. eggs)"
            value={ing.name}
            onChangeText={(v) => props.onUpdate(ing.key, { name: v })}
            maxLength={50}
          />
          <Row gap={space.sm} align="flex-start">
            <View style={{ flex: 1 }}>
              <Field
                label="Qty"
                placeholder="2"
                value={ing.quantity}
                onChangeText={(v) =>
                  props.onUpdate(ing.key, { quantity: v.replace(/[^0-9.]/g, "") })
                }
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <Field
                label="Unit"
                placeholder="cup, tbsp…"
                value={ing.unit}
                onChangeText={(v) => props.onUpdate(ing.key, { unit: v })}
                maxLength={16}
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1.2 }}>
              <Field
                label="Cost $"
                placeholder="0.80"
                value={ing.estimatedCost}
                onChangeText={(v) =>
                  props.onUpdate(ing.key, { estimatedCost: v.replace(/[^0-9.]/g, "") })
                }
                keyboardType="decimal-pad"
                maxLength={7}
              />
            </View>
          </Row>
        </Card>
      ))}

      <Button
        title="Add ingredient"
        variant="ghost"
        icon="plus"
        onPress={props.onAdd}
        full
      />

      <Card soft style={{ gap: space.sm }} elevation="none">
        <Row justify="space-between">
          <Row gap={6}>
            <Feather name="dollar-sign" size={16} color={colors.basilShadow} />
            <Txt variant="subheading">Running cost</Txt>
          </Row>
          <Txt variant="subheading">${props.totalCost.toFixed(2)}</Txt>
        </Row>
        <Divider />
        <Row justify="space-between">
          <Txt variant="label">Per serving</Txt>
          <Badge
            label={`$${props.costPerServing.toFixed(2)}`}
            tone="cheap"
            icon="tag"
            solid
          />
        </Row>
        {filledCount === 0 ? (
          <Txt variant="caption" muted>
            Add at least one named ingredient to save your recipe.
          </Txt>
        ) : null}
      </Card>
    </View>
  );
}

// ─── Step 3: Method + live nutrition ────────────────────────────────────────────

function MethodStep(props: {
  instructions: { key: string; text: string }[];
  onUpdate: (key: string, text: string) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
  nutrition: ReturnType<typeof calculateNutritionForFreeForm>;
  servings: number;
}) {
  const { nutrition } = props;
  const per = nutrition.perServing;
  const hasMatches = nutrition.matchedCount > 0;
  // Reasonable visual targets so the bars convey proportion (a per-serving meal).
  const targets = { protein: 35, carbs: 80, fat: 35 };

  return (
    <View style={{ gap: space.md }}>
      <SectionHeading title="Instructions" />

      {props.instructions.map((s, idx) => (
        <Card key={s.key} style={{ gap: space.sm }} elevation="sm">
          <Row justify="space-between">
            <Row gap={8}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.basil,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Txt variant="label" color="#FFFFFF" weight="800">
                  {idx + 1}
                </Txt>
              </View>
              <Txt variant="subheading">Step {idx + 1}</Txt>
            </Row>
            {props.instructions.length > 1 ? (
              <IconButton
                icon="trash-2"
                size={34}
                iconSize={16}
                bg={colors.tomatoTint}
                color={colors.tomatoShadow}
                onPress={() => props.onRemove(s.key)}
              />
            ) : null}
          </Row>
          <Field
            placeholder={
              idx === 0 ? "e.g. Heat oil in a pan over medium…" : "What happens next?"
            }
            value={s.text}
            onChangeText={(t) => props.onUpdate(s.key, t)}
            multiline
            style={{ minHeight: 64, textAlignVertical: "top" }}
            maxLength={400}
          />
        </Card>
      ))}

      <Button title="Add step" variant="ghost" icon="plus" onPress={props.onAdd} full />

      <Spacer h={space.xs} />
      <SectionHeading title="Nutrition preview" />

      <Card style={{ gap: space.md }}>
        {hasMatches ? (
          <>
            <Row justify="space-between" align="flex-end">
              <View>
                <Txt variant="display">{per.calories}</Txt>
                <Txt variant="label">calories / serving</Txt>
              </View>
              <Badge
                label={`${nutrition.matchedCount}/${nutrition.totalCount} matched`}
                tone={
                  nutrition.confidence === "high"
                    ? "pantry"
                    : nutrition.confidence === "medium"
                      ? "cheap"
                      : "nourish"
                }
                icon="zap"
              />
            </Row>
            <Divider />
            <Row gap={space.md} align="flex-start">
              <MacroBar
                label="Protein"
                value={per.protein}
                target={targets.protein}
                color={accent.protein.main}
              />
              <MacroBar
                label="Carbs"
                value={per.carbs}
                target={targets.carbs}
                color={accent.carbs.main}
              />
            </Row>
            <Row gap={space.md} align="flex-start">
              <MacroBar label="Fat" value={per.fat} target={targets.fat} color={accent.fat.main} />
              {per.fiber !== undefined ? (
                <MacroBar
                  label="Fiber"
                  value={per.fiber}
                  target={30}
                  color={accent.fiber.main}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </Row>
            <Txt variant="caption" muted>
              Estimated from your ingredients using Waivy's nutrition catalog. We matched{" "}
              {nutrition.matchedCount} of {nutrition.totalCount} — unmatched items don't count
              toward macros.
            </Txt>
          </>
        ) : (
          <EmptyState
            emoji="🥗"
            title="No macros yet"
            subtitle="Add recognizable ingredients (like eggs, rice, or chicken) in step 2 and we'll estimate the nutrition here automatically."
          />
        )}
      </Card>
    </View>
  );
}
