"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ChefHat,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  fallbackImageMeta,
  imageDataUrl,
  makeCustomRecipeId,
  saveCustomRecipe,
  storeRecipeImage,
} from "@/lib/customRecipeStorage";
import type { UserCreatedRecipe } from "@/lib/customRecipeTypes";
import {
  generateRecipeImage,
  isWorkerConfigured,
} from "@/lib/workerClient";

const EQUIPMENT_OPTS = [
  "microwave",
  "stovetop",
  "oven",
  "rice-cooker",
  "air-fryer",
  "no-kitchen",
];

interface IngredientRow {
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  optional: boolean;
  userAlreadyHas: boolean;
}

interface StepRow {
  instruction: string;
  timerMinutes?: number;
}

export default function ManualRecipeBuilderPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<UserCreatedRecipe["mealType"]>("dinner");
  const [servings, setServings] = useState(2);
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(15);
  const [difficulty, setDifficulty] = useState<UserCreatedRecipe["difficulty"]>("easy");
  const [equipment, setEquipment] = useState<string[]>(["stovetop"]);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: "", quantity: 1, unit: "cup", estimatedCost: 0, optional: false, userAlreadyHas: false },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([{ instruction: "" }]);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [autoImage, setAutoImage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCost = ingredients.reduce(
    (sum, i) => (i.optional ? sum : sum + i.estimatedCost),
    0,
  );
  const costPerServing = totalCost / Math.max(1, servings);

  function updateIngredient(i: number, patch: Partial<IngredientRow>) {
    setIngredients((arr) => arr.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function addIngredient() {
    setIngredients((arr) => [
      ...arr,
      { name: "", quantity: 1, unit: "cup", estimatedCost: 0, optional: false, userAlreadyHas: false },
    ]);
  }
  function removeIngredient(i: number) {
    setIngredients((arr) => arr.filter((_, idx) => idx !== i));
  }
  function updateStep(i: number, patch: Partial<StepRow>) {
    setSteps((arr) => arr.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function addStep() {
    setSteps((arr) => [...arr, { instruction: "" }]);
  }
  function removeStep(i: number) {
    setSteps((arr) => arr.filter((_, idx) => idx !== i));
  }
  function toggleEquipment(eq: string) {
    setEquipment((curr) => (curr.includes(eq) ? curr.filter((e) => e !== eq) : [...curr, eq]));
  }

  async function save() {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please give your recipe a name.");
      return;
    }
    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }
    const validSteps = steps.filter((s) => s.instruction.trim());
    if (validSteps.length === 0) {
      setError("Add at least one step.");
      return;
    }
    setSaving(true);
    const id = makeCustomRecipeId(trimmedName, "user");
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const noStovetop = !equipment.includes("stovetop") && !equipment.includes("oven");

    const recipe: UserCreatedRecipe = {
      id,
      name: trimmedName,
      description: description.trim(),
      mealType,
      cuisineStyle: "",
      servings,
      prepTimeMinutes: prepTime,
      cookTimeMinutes: cookTime,
      totalTimeMinutes: prepTime + cookTime,
      difficulty,
      equipment,
      primaryCookingMethod:
        equipment.includes("air-fryer") && equipment.includes("microwave")
          ? "air-fryer-and-microwave"
          : equipment[0] ?? "stovetop",
      noStovetopRequired: noStovetop,
      estimatedTotalCost: totalCost,
      estimatedCostPerServing: costPerServing,
      ingredients: validIngredients.map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity,
        unit: i.unit,
        estimatedCost: i.estimatedCost,
        optional: i.optional,
        userAlreadyHas: i.userAlreadyHas,
      })),
      steps: validSteps.map((s) => s.instruction.trim()),
      tags: tagList,
      notes: notes.trim() || undefined,
      image: fallbackImageMeta(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAIGenerated: false,
      isUserCreated: true,
    };
    saveCustomRecipe(recipe);

    if (autoImage && isWorkerConfigured()) {
      try {
        const img = await generateRecipeImage({
          recipeName: trimmedName,
          ingredients: validIngredients.map((i) => i.name).slice(0, 8),
          method: recipe.primaryCookingMethod,
        });
        if (img.b64_json) {
          const stored = storeRecipeImage(id, img.b64_json, {
            prompt: img.prompt,
            model: img.model,
          });
          if (stored.ok) {
            saveCustomRecipe({
              ...recipe,
              image: {
                src: imageDataUrl(img.b64_json),
                alt: trimmedName,
                sourceName: "AI generated",
                license: "Generated image",
                isAIGenerated: true,
                isFallback: false,
                generatedPrompt: img.prompt,
                generatedAt: new Date().toISOString(),
                model: img.model,
              },
            });
          }
        } else if (img.url) {
          saveCustomRecipe({
            ...recipe,
            image: {
              src: img.url,
              alt: trimmedName,
              sourceName: "AI generated",
              license: "Generated image",
              isAIGenerated: true,
              isFallback: false,
              generatedPrompt: img.prompt,
              generatedAt: new Date().toISOString(),
              model: img.model,
            },
          });
        }
      } catch {
        // image errors are non-fatal — recipe is still saved
      }
    }

    setSaving(false);
    router.push(`/recipes/custom?id=${id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/recipe-studio"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-emerald-700"
      >
        <ArrowLeft size={14} /> Back to Recipe Studio
      </Link>

      <header>
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <ChefHat size={14} /> Build your own
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
          Recipe card builder
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Fill in the details, hit save, and we&apos;ll generate a custom image
          for your recipe.
        </p>
      </header>

      {error && (
        <Card className="border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
          Basics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Recipe name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sticky honey garlic tofu bowl"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </Field>
          <Field label="Meal type">
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as UserCreatedRecipe["mealType"])}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="meal-prep">Meal prep</option>
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="1–2 sentences describing the dish"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Servings">
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value || "1", 10))}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </Field>
          <Field label="Prep min">
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(parseInt(e.target.value || "0", 10))}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </Field>
          <Field label="Cook min">
            <input
              type="number"
              min={0}
              value={cookTime}
              onChange={(e) => setCookTime(parseInt(e.target.value || "0", 10))}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as UserCreatedRecipe["difficulty"])
              }
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            >
              <option value="very easy">Very easy</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
            </select>
          </Field>
        </div>
        <Field label="Equipment">
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTS.map((eq) => (
              <button
                type="button"
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className={
                  equipment.includes(eq)
                    ? "rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                }
              >
                {eq}
              </button>
            ))}
          </div>
        </Field>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            Ingredients
          </h2>
          <Button size="sm" leftIcon={<Plus size={12} />} onClick={addIngredient}>
            Add ingredient
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {ingredients.map((row, i) => (
            <div
              key={i}
              className="grid items-center gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <input
                value={row.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
                placeholder="Ingredient name"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
              <input
                type="number"
                step="0.25"
                min={0}
                value={row.quantity}
                onChange={(e) =>
                  updateIngredient(i, { quantity: parseFloat(e.target.value || "0") })
                }
                placeholder="Qty"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
              <input
                value={row.unit}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                placeholder="Unit"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
              <input
                type="number"
                step="0.05"
                min={0}
                value={row.estimatedCost}
                onChange={(e) =>
                  updateIngredient(i, {
                    estimatedCost: parseFloat(e.target.value || "0"),
                  })
                }
                placeholder="$"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
              <button
                onClick={() => removeIngredient(i)}
                className="rounded-full p-2 text-stone-400 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-3 text-sm text-stone-700">
          <span>Total: <span className="font-semibold text-stone-900">${totalCost.toFixed(2)}</span></span>
          <span>Per serving: <span className="font-semibold text-stone-900">${costPerServing.toFixed(2)}</span></span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            Steps
          </h2>
          <Button size="sm" leftIcon={<Plus size={12} />} onClick={addStep}>
            Add step
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 grid h-6 w-6 flex-none place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <textarea
                value={s.instruction}
                onChange={(e) => updateStep(i, { instruction: e.target.value })}
                rows={2}
                placeholder="Describe the step"
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
              <button
                onClick={() => removeStep(i)}
                className="mt-1 rounded-full p-2 text-stone-400 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
          Tags &amp; notes
        </h2>
        <Field label="Tags (comma-separated)">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="dorm-friendly, high-protein, one-pot"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </Field>
        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </Field>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
          Recipe image
        </h2>
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={autoImage}
            onChange={(e) => setAutoImage(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
          />
          Generate an image for this recipe automatically
        </label>
        {!isWorkerConfigured() && (
          <p className="mt-2 text-xs text-amber-700">
            AI features are not configured on this build. We&apos;ll use a
            placeholder image for now.
          </p>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/recipe-studio")}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={saving}
          leftIcon={
            saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : autoImage ? (
              <Sparkles size={14} />
            ) : (
              <Save size={14} />
            )
          }
        >
          {saving ? "Saving…" : autoImage ? "Save & generate image" : "Save recipe"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}
