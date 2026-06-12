"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChefHat,
  Loader2,
  RefreshCw,
  Flame,
  ShoppingBasket,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  generateRecipe,
  generateRecipeOptions,
  generateRecipeImage,
  importRecipeUrl,
  importRecipeText,
  webSearchRecipes,
  isWorkerConfigured,
  type GeneratedRecipe,
  type GeneratedRecipeOption,
  type RecipeSourceMetadata,
  type WebRecipeCandidate,
} from "@/lib/workerClient";
import { GeneratedRecipeOptionBubbles } from "@/components/ai/GeneratedRecipeOptionBubbles";
import { AIChefDemoHero } from "@/components/ai/AIChefDemoHero";
import {
  fallbackImageMeta,
  imageDataUrl,
  makeCustomRecipeId,
  saveCustomRecipe,
  storeRecipeImage,
  getCustomRecipes,
} from "@/lib/customRecipeStorage";
import type { AIGeneratedRecipe } from "@/lib/customRecipeTypes";
import { useAppStore } from "@/lib/AppStore";
import { INGREDIENTS } from "@/data/ingredients";
import { resolvedToCustom, saveCustomIngredient, findExistingByName, getCustomIngredients } from "@/lib/customIngredientStorage";
import { AIChefPantrySelector } from "@/components/ai/AIChefPantrySelector";
import { ReceiptUpload } from "@/components/pantry/ReceiptUpload";
import { PantryPhotoUpload } from "@/components/pantry/PantryPhotoUpload";
import { PantrySmartAdd } from "@/components/pantry/PantrySmartAdd";
import { Refrigerator } from "lucide-react";
import { calculateNutritionForFreeForm } from "@/lib/nutritionEngine";
import { generateRecipeQuick, generateRecipeQuickOptions, isAiEnabled } from "@/lib/anthropic";
import { useToast } from "@/components/ui/Toast";
import { AIChefSteppedLoader } from "@/components/ai/AIChefSteppedLoader";
import { RecipeStatsRow } from "@/components/recipe/RecipeStatsRow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LogGeneratedRecipeButton } from "@/components/nourish/LogGeneratedRecipeButton";
import { ThreeDButton, ThreeDLink } from "@/components/ui/ThreeDButton";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { StatCard } from "@/components/ui/StatCard";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { LiquidGlassPanel } from "@/components/visual-effects/LiquidGlassPanel";
import { VisualEmptyState } from "@/components/ui/VisualEmptyState";
import { Coins, Beef, Clock } from "lucide-react";
import { hapticMedium } from "@/lib/haptics";

// If the AI's ingredient list maps cleanly to our catalog, replace its
// guessed macros with the deterministic engine result.
//
// IMPORTANT: The earlier version bailed out when confidence was "low",
// which left the AI's bad numbers in place. That's exactly when the AI
// is most likely to have returned zeros. New rule:
//   1. Always compute from ingredients via the engine.
//   2. Use the calc result when the AI's per-serving calories are <=0
//      or non-finite (the visible "0 calories" bug). Otherwise prefer
//      AI's numbers but fall back to calc on any individual zero
//      field — protein/carbs/fat shouldn't all be 0 either.
function reconcileNutrition(r: GeneratedRecipe): GeneratedRecipe {
  if (!r.ingredients?.length) return r;
  const calc = calculateNutritionForFreeForm(r.ingredients, r.servings || 1);
  const aiCals = Number(r.estimatedNutrition?.calories);
  const aiProtein = Number(r.estimatedNutrition?.protein);
  const aiCarbs = Number(r.estimatedNutrition?.carbs);
  const aiFat = Number(r.estimatedNutrition?.fat);
  const aiAllZeroOrBad =
    !(Number.isFinite(aiCals) && aiCals > 0) &&
    !(Number.isFinite(aiProtein) && aiProtein > 0) &&
    !(Number.isFinite(aiCarbs) && aiCarbs > 0) &&
    !(Number.isFinite(aiFat) && aiFat > 0);
  // When AI returned all-zero or non-finite, OR our calc has high/medium
  // confidence, use the engine result. This catches the "0 calories"
  // display bug end-to-end.
  const preferCalc = aiAllZeroOrBad || calc.confidence !== "low";
  if (!preferCalc) return r;
  const pick = (calcVal: number, aiVal: number) => {
    const c = Number(calcVal);
    const a = Number(aiVal);
    if (Number.isFinite(c) && c > 0) return c;
    if (Number.isFinite(a) && a > 0) return a;
    return 0;
  };
  return {
    ...r,
    estimatedNutrition: {
      calories: pick(calc.perServing.calories, aiCals),
      protein: pick(calc.perServing.protein, aiProtein),
      carbs: pick(calc.perServing.carbs, aiCarbs),
      fat: pick(calc.perServing.fat, aiFat),
      fiber: pick(calc.perServing.fiber ?? 0, Number(r.estimatedNutrition?.fiber ?? 0)),
    },
  };
}

// Safe money formatter — AI sometimes returns missing or non-numeric cost
// fields, which would crash the page with "undefined.toFixed is not a function".
function money(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : "—";
}

const STARTER_PROMPTS = [
  "I have rice, eggs, and frozen peas — make a cheap dinner.",
  "Spicy, cheap, high-protein, air fryer friendly.",
  "Something like fried rice but using leftover tortillas.",
  "Microwave-only breakfast under $1.50 with oats and banana.",
];

const EQUIPMENT_OPTS = [
  "microwave",
  "stovetop",
  "oven",
  "rice-cooker",
  "air-fryer",
];

const DIET_OPTS = ["vegetarian", "vegan", "high-protein", "gluten-free", "dairy-free"];

// "Something creative" mode picks one item from each pool and weaves
// them into a seed string the model sees in its prompt. Two clicks in
// a row should rarely land on the same combo (5^4 = 625 combos).
const CREATIVE_CUISINES = [
  "Korean × Italian",
  "Japanese × Mexican",
  "Thai × Mediterranean",
  "Vietnamese × Tex-Mex",
  "Indian × Southern American",
  "Filipino × Cajun",
  "Levantine × Japanese",
  "West African × Caribbean",
];
const CREATIVE_TECHNIQUES = [
  "smashed-and-crisped",
  "steam-then-sear",
  "cold-marinated",
  "torn-and-toasted",
  "sticky-glazed",
  "pickle-charred",
  "blistered + raw",
  "broth-poached then fried",
];
const CREATIVE_FORMATS = [
  "served on a savory waffle",
  "tucked inside a folded omelet",
  "as a high-protein mug bowl",
  "as a hand-held taco-wrap hybrid",
  "as a single-skillet party crisp",
  "on a bed of crushed chips",
  "as a no-cook chilled bowl",
  "ladled over crispy ramen",
];
const CREATIVE_FLAVOR_ANCHORS = [
  "gochujang + honey",
  "miso + brown butter",
  "harissa + yogurt",
  "chili crisp + lime",
  "fish sauce + caramel",
  "tamarind + maple",
  "preserved lemon + black pepper",
  "ginger-scallion + sesame",
];

function pickOne<T>(arr: readonly T[], salt: number): T {
  // No Math.random in workflow-safe code paths, but this file is a
  // React client — Math.random is fine here. The salt arg lets us bias
  // the picks slightly so the same render doesn't repeat values.
  const i = Math.floor((Math.random() + salt * 0.137) * arr.length) % arr.length;
  return arr[i];
}

function buildCreativeSeed(): string {
  const cuisine = pickOne(CREATIVE_CUISINES, 1);
  const technique = pickOne(CREATIVE_TECHNIQUES, 2);
  const format = pickOne(CREATIVE_FORMATS, 3);
  const anchor = pickOne(CREATIVE_FLAVOR_ANCHORS, 4);
  return `Lean into a ${cuisine} mashup, ${technique} technique, ${format}, with ${anchor} as the flavor anchor. The result should still be dorm-cookable and taste excellent.`;
}

export default function AIChefPageWrapper() {
  return (
    <Suspense fallback={<div className="text-stone-500">Loading…</div>}>
      <AIChefPage />
    </Suspense>
  );
}

function AIChefPage() {
  const { addGroceryItems, toggleSaved, isSaved, pantry } = useAppStore();
  const toast = useToast();

  const [mode, setMode] = useState<"pantry" | "have" | "imagine" | "web" | "url" | "paste">("pantry");
  const [selectedPantryIds, setSelectedPantryIds] = useState<Set<string>>(
    () => new Set(pantry.map((p) => p.ingredientId)),
  );
  // Keep selection in sync when pantry changes (e.g. user adds a new item
  // on the Pantry tab open in another window). New items default to selected.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPantryIds((prev) => {
      const next = new Set(prev);
      for (const p of pantry) {
        if (!next.has(p.ingredientId)) next.add(p.ingredientId);
      }
      // Drop ids that aren't in the pantry anymore
      const pantryIds = new Set(pantry.map((p) => p.ingredientId));
      for (const id of next) {
        if (!pantryIds.has(id)) next.delete(id);
      }
      return next;
    });
  }, [pantry]);
  const [ingredients, setIngredients] = useState("");
  const [cravings, setCravings] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteSourceUrl, setPasteSourceUrl] = useState("");
  const [pasteCreator, setPasteCreator] = useState("");
  const [pastePlatform, setPastePlatform] = useState<
    "tiktok" | "instagram" | "youtube" | "pinterest" | "reddit" | "other"
  >("tiktok");
  const [webCandidates, setWebCandidates] = useState<WebRecipeCandidate[] | null>(null);
  const [sourceMeta, setSourceMeta] = useState<RecipeSourceMetadata | null>(null);
  const [budget, setBudget] = useState<number>(3);
  const [servings, setServings] = useState<number>(2);
  const [equipment, setEquipment] = useState<string[]>([...EQUIPMENT_OPTS]);
  const [diet, setDiet] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState("any");
  const [creativity, setCreativity] = useState<"practical" | "balanced" | "creative">("balanced");
  const [autoImage, setAutoImage] = useState(true);

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedImageDataUrl, setSavedImageDataUrl] = useState<string | null>(null);

  // Multi-option flow
  const [aiNotes, setAiNotes] = useState("");
  const [options, setOptions] = useState<GeneratedRecipeOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [optionImages, setOptionImages] = useState<Record<string, string>>({});
  const [optionSavedIds, setOptionSavedIds] = useState<Record<string, string>>({});
  const [generatingImageIds, setGeneratingImageIds] = useState<Set<string>>(new Set());
  const [appending, setAppending] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Resolve a pantry ingredient ID to a human-readable name (built-in OR custom)
  const pantryNamesById = useMemo(() => {
    const out = new Map<string, string>();
    for (const p of pantry) {
      const builtin = INGREDIENTS.find((i) => i.id === p.ingredientId);
      if (builtin) {
        out.set(p.ingredientId, builtin.name);
        continue;
      }
      const customs = typeof window === "undefined" ? [] : getCustomIngredients();
      const c = customs.find((x) => x.id === p.ingredientId);
      if (c) out.set(p.ingredientId, c.displayName || c.canonicalName);
    }
    return out;
  }, [pantry]);

  function toggleSet(set: string[], v: string): string[] {
    return set.includes(v) ? set.filter((x) => x !== v) : [...set, v];
  }

  async function run(refinement?: string) {
    setLoading(true);
    setError(null);
    if (!refinement) {
      setRecipe(null);
      setSavedId(null);
      setSavedImageDataUrl(null);
      setSourceMeta(null);
    }
    try {
      // In "pantry" mode, send the names of the selected pantry items
      // straight from the live AppStore (single source of truth). In all
      // other modes, parse the typed textarea.
      const fromPantry =
        mode === "pantry"
          ? Array.from(selectedPantryIds)
              .map((id) => pantryNamesById.get(id))
              .filter((n): n is string => !!n)
          : ingredients.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      // Dispatch by mode — every branch ends with a GeneratedRecipe assigned to `r`
      let r: GeneratedRecipe;
      let importedSource: RecipeSourceMetadata | null = null;
      if (mode === "web" && !refinement) {
        setWebCandidates(null);
        const wsr = await webSearchRecipes({
          ingredients: fromPantry,
          cravings,
          equipment,
          dietTags: diet,
          budgetPerServing: budget,
          maxResults: 5,
        });
        setWebCandidates(wsr.candidates);
        setLoading(false);
        return;
      }
      if (mode === "url" && !refinement) {
        const out = await importRecipeUrl({
          url: importUrl.trim(),
          ingredients: fromPantry,
          budgetPerServing: budget,
          equipment,
          dietTags: diet,
          servings,
        });
        r = out.recipe;
        importedSource = out.source;
      } else if (mode === "paste" && !refinement) {
        const out = await importRecipeText({
          text: pasteText,
          sourceUrl: pasteSourceUrl.trim() || undefined,
          sourcePlatform: pastePlatform,
          creatorName: pasteCreator.trim() || undefined,
          ingredients: fromPantry,
          budgetPerServing: budget,
          equipment,
          dietTags: diet,
          servings,
        });
        r = out.recipe;
        importedSource = out.source;
      } else {
        // Fast path: direct Haiku call from browser (≈ 2–4s) when the
        // Anthropic key is available. Falls back to the worker + OpenAI
        // path (10–14s) when it isn't.
        if (isAiEnabled()) {
          r = await generateRecipeQuick({
            pantryIngredients: fromPantry,
            budgetPerServing: budget,
            servings,
            equipment,
            timeLimit,
            dietTags: diet,
            cravings:
              mode === "imagine" || (mode === "pantry" && cravings.trim())
                ? cravings
                : undefined,
            refinement,
          });
        } else {
          r = await generateRecipe({
            ingredients: fromPantry,
            budgetPerServing: budget,
            servings,
            equipment,
            timeLimit,
            dietTags: diet,
            cravings:
              mode === "imagine" || (mode === "pantry" && cravings.trim())
                ? cravings
                : undefined,
            creativity,
            refinement,
          });
        }
      }
      r = reconcileNutrition(r);
      setRecipe(r);
      setSourceMeta(importedSource);
      // Persist + (optionally) generate image
      const id = makeCustomRecipeId(r.name, "gen");
      const ai: AIGeneratedRecipe = {
        id,
        isAIGenerated: true,
        isUserCreated: false,
        name: r.name,
        description: r.description,
        userRequestSummary: r.userRequestSummary,
        whyThisFits: r.whyThisFits,
        mealType: r.mealType,
        cuisineStyle: r.cuisineStyle,
        servings: r.servings,
        prepTimeMinutes: r.prepTimeMinutes,
        cookTimeMinutes: r.cookTimeMinutes,
        totalTimeMinutes: r.totalTimeMinutes,
        difficulty: r.difficulty,
        equipment: r.equipment,
        primaryCookingMethod: r.primaryCookingMethod,
        noStovetopRequired: r.noStovetopRequired,
        estimatedTotalCost: r.estimatedTotalCost,
        estimatedCostPerServing: r.estimatedCostPerServing,
        estimatedMissingIngredientCost: r.estimatedMissingIngredientCost,
        ingredients: r.ingredients,
        missingIngredients: r.missingIngredients,
        steps: r.steps,
        guidedCookingSteps: r.guidedCookingSteps,
        cheapTips: r.cheapTips,
        substitutions: r.substitutions,
        makeItCheaper: r.makeItCheaper,
        makeItHealthier: r.makeItHealthier,
        makeItHigherProtein: r.makeItHigherProtein,
        studentTips: r.studentTips,
        storageInstructions: r.storageInstructions,
        reheatingInstructions: r.reheatingInstructions,
        safetyNotes: r.safetyNotes,
        estimatedNutrition: r.estimatedNutrition,
        tags: r.tags,
        image: fallbackImageMeta(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveCustomRecipe(ai);
      setSavedId(id);
      toast.reward(`Created "${r.name}" — saved to Recipe Studio`);

      if (autoImage) {
        setImageLoading(true);
        try {
          const img = await generateRecipeImage({
            recipeName: r.name,
            ingredients: r.ingredients.map((i) => i.name).slice(0, 8),
            method: r.primaryCookingMethod,
            prompt: r.imagePromptHint,
          });
          if (img.b64_json) {
            const stored = storeRecipeImage(id, img.b64_json, {
              prompt: img.prompt,
              model: img.model,
            });
            if (stored.ok) {
              const dataUrl = imageDataUrl(img.b64_json);
              setSavedImageDataUrl(dataUrl);
              saveCustomRecipe({
                ...ai,
                image: {
                  src: dataUrl,
                  alt: r.name,
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
            setSavedImageDataUrl(img.url);
            saveCustomRecipe({
              ...ai,
              image: {
                src: img.url,
                alt: r.name,
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
          // image errors are non-fatal
        } finally {
          setImageLoading(false);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  // ---- Multi-option helpers ----

  async function generateImageForOption(o: GeneratedRecipeOption) {
    setImageError(null);
    setGeneratingImageIds((s) => new Set(s).add(o.id));
    try {
      const img = await generateRecipeImage({
        recipeName: o.recipe.name,
        ingredients: o.recipe.ingredients.map((i) => i.name).slice(0, 8),
        method: o.recipe.primaryCookingMethod,
        prompt: o.recipe.imagePromptHint,
      });
      const src = img.b64_json
        ? `data:image/png;base64,${img.b64_json}`
        : img.url;
      if (src) {
        setOptionImages((m) => ({ ...m, [o.id]: src }));
        // Update saved recipe with image URL
        const saved = optionSavedIds[o.id];
        if (saved) {
          const existing = getCustomRecipes().find((r) => r.id === saved);
          if (existing) {
            saveCustomRecipe({
              ...existing,
              image: {
                src,
                alt: o.recipe.name,
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
        }
      }
    } catch (e) {
      setImageError(
        e instanceof Error
          ? e.message.includes("verified") || e.message.includes("403")
            ? "Image generation needs OpenAI organization verification. Add a phone number at platform.openai.com/settings/organization/general or the worker will auto-fall-back to dall-e-3 on next try."
            : `Couldn't generate image: ${e.message}`
          : "Image generation failed",
      );
    } finally {
      setGeneratingImageIds((s) => {
        const next = new Set(s);
        next.delete(o.id);
        return next;
      });
    }
  }

  function persistOption(o: GeneratedRecipeOption): string {
    const id = optionSavedIds[o.id] ?? makeCustomRecipeId(o.recipe.name, "gen");
    const r = reconcileNutrition(o.recipe);
    const ai: AIGeneratedRecipe = {
      id,
      isAIGenerated: true,
      isUserCreated: false,
      name: r.name,
      description: r.description,
      userRequestSummary: r.userRequestSummary,
      whyThisFits: r.whyThisFits,
      mealType: r.mealType,
      cuisineStyle: r.cuisineStyle,
      servings: r.servings,
      prepTimeMinutes: r.prepTimeMinutes,
      cookTimeMinutes: r.cookTimeMinutes,
      totalTimeMinutes: r.totalTimeMinutes,
      difficulty: r.difficulty,
      equipment: r.equipment,
      primaryCookingMethod: r.primaryCookingMethod,
      noStovetopRequired: r.noStovetopRequired,
      estimatedTotalCost: r.estimatedTotalCost,
      estimatedCostPerServing: r.estimatedCostPerServing,
      estimatedMissingIngredientCost: r.estimatedMissingIngredientCost,
      ingredients: r.ingredients,
      missingIngredients: r.missingIngredients,
      steps: r.steps,
      guidedCookingSteps: r.guidedCookingSteps,
      cheapTips: r.cheapTips,
      substitutions: r.substitutions,
      makeItCheaper: r.makeItCheaper,
      makeItHealthier: r.makeItHealthier,
      makeItHigherProtein: r.makeItHigherProtein,
      studentTips: r.studentTips,
      storageInstructions: r.storageInstructions,
      reheatingInstructions: r.reheatingInstructions,
      safetyNotes: r.safetyNotes,
      estimatedNutrition: r.estimatedNutrition,
      tags: r.tags,
      image: fallbackImageMeta(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCustomRecipe(ai);
    setOptionSavedIds((m) => ({ ...m, [o.id]: id }));
    return id;
  }

  async function runOptions(append = false) {
    if (!isWorkerConfigured()) return;
    setLoading(true);
    setError(null);
    setImageError(null);
    if (!append) {
      setOptions([]);
      setSelectedOptionId(null);
      setOptionImages({});
      setOptionSavedIds({});
    }
    setAppending(append);
    try {
      const pantryNames =
        mode === "pantry"
          ? Array.from(selectedPantryIds)
              .map((id) => pantryNamesById.get(id))
              .filter((n): n is string => !!n)
          : ingredients
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter(Boolean);
      // Fast path: parallel Haiku calls direct from browser (~3–5s total)
      // instead of the worker-based mega-call (22s+). Falls back to the
      // worker path when the Anthropic key isn't configured.
      // When the user picked "Something creative" (mode === "imagine"),
      // we crank the model's temperature, inject a bold-cooking directive
      // into the prompt, and switch the 4 parallel role hints to creative
      // archetypes (fusion mashup / weird format / comfort flip / random
      // pantry wildcard). A fresh seed per click also prevents two
      // back-to-back generations from returning the same wildcard.
      const wantsCreative = mode === "imagine";
      const creativeSeed = wantsCreative ? buildCreativeSeed() : undefined;
      const res = isAiEnabled()
        ? await generateRecipeQuickOptions({
            pantryIngredients: pantryNames,
            cravings:
              [cravings.trim(), aiNotes.trim()]
                .filter(Boolean)
                .join(" — ") || undefined,
            budgetPerServing: budget,
            servings,
            equipment,
            dietTags: diet,
            creativityBoost: wantsCreative,
            creativeSeed,
          })
        : await generateRecipeOptions({
            pantryIngredients: pantryNames,
            selectedPantryIngredientIds: Array.from(selectedPantryIds),
            aiNotes: aiNotes.trim() || undefined,
            cravingText: cravings.trim() || undefined,
            budgetPerServing: budget,
            servings,
            equipment,
            dietTags: diet,
            // Force the slow worker path into its strongest creativity
            // setting too when the user picked the imagine mode, so both
            // code paths behave consistently.
            creativityLevel: wantsCreative ? "creative" : creativity,
            appendToExisting: append,
            previousOptions: append
              ? options.map((o) => ({ recipe: { name: o.recipe.name } }))
              : undefined,
          });
      const merged = append ? [...options, ...res.options] : res.options;
      const count = res.options.length;
      // Guard the "0 options returned" edge — surface a real error
      // instead of a celebratory "Created 0 recipe ideas 🎉" toast.
      if (count === 0) {
        if (!append) {
          throw new Error("AI Chef didn't return any ideas — try again");
        } else {
          toast.info("No additional ideas this round — try again");
          return;
        }
      }
      setOptions(merged);
      const mainId = append
        ? selectedOptionId ?? res.mainOptionId
        : res.mainOptionId;
      setSelectedOptionId(mainId);
      // Persist every option (cheap — JSON only). Image gen is lazy.
      for (const o of res.options) persistOption(o);
      // Generate image for the main option right away
      const mainOpt = res.options.find((o) => o.id === res.mainOptionId);
      if (mainOpt && !append) {
        void generateImageForOption(mainOpt);
      }
      toast.reward(
        append
          ? `Added ${count} more recipe idea${count === 1 ? "" : "s"}`
          : `Created ${count} recipe idea${count === 1 ? "" : "s"} 🎉`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setAppending(false);
    }
  }

  function selectOption(id: string) {
    setSelectedOptionId(id);
    if (!optionImages[id] && !generatingImageIds.has(id) && autoImage) {
      const o = options.find((x) => x.id === id);
      if (o) void generateImageForOption(o);
    }
  }

  const selectedOption =
    options.find((o) => o.id === selectedOptionId) ?? null;

  function addAllMissingToGrocery() {
    if (!recipe || !savedId) return;
    const items: { recipeId: string; ingredients: { name: string; cost: number }[] } = {
      recipeId: savedId,
      ingredients: (recipe.missingIngredients || []).map((m) => ({
        name: m.name,
        cost: m.estimatedCost,
      })),
    };
    // Reuse existing grocery store via custom ingredients
    for (const m of recipe.missingIngredients || []) {
      const ex = findExistingByName(
        m.name,
        INGREDIENTS.map((i) => ({ name: i.name, id: i.id })),
      );
      const ingredientId = ex
        ? ex.id
        : (() => {
            const c = resolvedToCustom({
              canonicalName: m.name,
              displayName: m.name,
              originalText: m.name,
              aliases: [],
              category: "other",
              ingredientRole: "other",
              storageType: "unknown",
              estimatedUnitCost: m.estimatedCost,
              unit: "each",
              dietaryTags: [],
              allergyTags: [],
              confidence: 0.8,
            });
            saveCustomIngredient(c);
            return c.id;
          })();
      // Build a minimal Recipe-like object to satisfy addGroceryItems signature
      addGroceryItems(
        {
          id: savedId,
          name: recipe.name,
          ingredients: [
            { ingredientId, quantity: 1 } as { ingredientId: string; quantity: number },
          ],
        } as never,
        [ingredientId],
      );
    }
    const n = recipe.missingIngredients?.length ?? 0;
    if (n > 0) {
      toast.success(`Added ${n} missing item${n === 1 ? "" : "s"} to Grocery`);
    }
    void items;
  }

  return (
    <div className="space-y-10">
      <AIChefDemoHero />

      {!isWorkerConfigured() && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-amber-100 text-amber-700">
              <ChefHat size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900">
                AI Chef is taking a break.
              </p>
              <p className="mt-1 text-sm text-amber-900">
                The recipe generator is offline right now. You can still browse
                hundreds of student-friendly recipes, build your pantry, and
                use Pantry-to-Plate to find meals you can make.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/cheap-recipes"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Browse cheap recipes
                </Link>
                <Link
                  href="/pantry"
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                >
                  Use my pantry
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-gradient-to-br from-white via-violet-50/30 to-white p-5 shadow-sm sm:p-7">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(circle_at_90%_10%,black,transparent_55%)]"
        />
        <div className="relative">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={11} /> Choose your starting point
            </span>
          }
          title="What should we cook?"
          description="Pick a mode, give AI Chef context, then hit Generate. You'll get four options to compare."
          tone="violet"
          className="mb-5"
        />
        <div className="mb-5 flex flex-wrap gap-2">
          <ModeChip
            active={mode === "pantry"}
            onClick={() => setMode("pantry")}
          >
            <Refrigerator size={12} className="mr-1 inline" />
            Use my pantry
            {pantry.length > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-white/30 px-1 text-[10px] font-semibold">
                {pantry.length}
              </span>
            )}
          </ModeChip>
          <ModeChip active={mode === "have"} onClick={() => setMode("have")}>
            Type ingredients
          </ModeChip>
          <ModeChip
            active={mode === "imagine"}
            onClick={() => setMode("imagine")}
          >
            Something creative
          </ModeChip>
          <ModeChip active={mode === "web"} onClick={() => setMode("web")}>
            Search the web
          </ModeChip>
          <ModeChip active={mode === "url"} onClick={() => setMode("url")}>
            Import a recipe URL
          </ModeChip>
          <ModeChip
            active={mode === "paste"}
            onClick={() => setMode("paste")}
          >
            Paste a recipe / caption
          </ModeChip>
        </div>

        {mode === "pantry" ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-stone-800">
                Pantry ingredients AI Chef can use
              </label>
              <p className="mt-1 text-xs text-stone-500">
                Tap a chip to include or exclude it from this recipe. Add more
                below — snap a fridge photo or smart-paste a list — without
                leaving this page.
              </p>
            </div>
            <AIChefPantrySelector
              selectedIds={selectedPantryIds}
              onChange={setSelectedPantryIds}
            />
            <PantryPhotoUpload />
            <ReceiptUpload variant="compact" />
            <PantrySmartAdd />
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
                <Sparkles size={14} className="text-violet-600" /> Notes for AI
              </label>
              <textarea
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                rows={3}
                placeholder="Make something like a sushi roll using rice and seaweed. Keep it cheap, use what I already have, prefer microwave."
                className="mt-1 w-full rounded-2xl border border-violet-200 bg-violet-50/50 p-3 text-sm focus:border-violet-400 focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-xs text-stone-500">
                Tell the AI your idea, vibe, or craving. It treats this as
                creative direction.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-800">
                Optional craving (what kind of dish?)
              </label>
              <textarea
                value={cravings}
                onChange={(e) => setCravings(e.target.value)}
                rows={2}
                placeholder="something Asian, quick microwave dinner, high protein…"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        ) : mode === "url" ? (
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-800">
              Recipe URL (food blog, recipe site, etc.)
            </label>
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://cookieandkate.com/..."
              className="w-full rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
            <p className="text-xs text-stone-500">
              We&apos;ll extract structured recipe data (JSON-LD) when
              available, adapt it to your pantry / budget / equipment, and
              keep attribution to the original creator.
            </p>
          </div>
        ) : mode === "paste" ? (
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-800">
              Paste a TikTok caption, blog excerpt, transcript, or recipe text
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={5}
              placeholder="Paste the caption, recipe text, or transcript here. The AI will turn it into a clean recipe card."
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={pastePlatform}
                onChange={(e) =>
                  setPastePlatform(
                    e.target.value as typeof pastePlatform,
                  )
                }
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              >
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="pinterest">Pinterest</option>
                <option value="reddit">Reddit</option>
                <option value="other">Other</option>
              </select>
              <input
                value={pasteSourceUrl}
                onChange={(e) => setPasteSourceUrl(e.target.value)}
                placeholder="Source URL (optional)"
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
              <input
                value={pasteCreator}
                onChange={(e) => setPasteCreator(e.target.value)}
                placeholder="Creator name (optional)"
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
            </div>
            <p className="text-xs text-stone-500">
              We don&apos;t scrape TikTok/Instagram directly — paste the
              content you have access to and we&apos;ll build the recipe card
              with credit to the creator.
            </p>
          </div>
        ) : mode === "web" ? (
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-800">
              Tell me what you want — we&apos;ll search the web
            </label>
            <textarea
              value={cravings}
              onChange={(e) => setCravings(e.target.value)}
              rows={2}
              placeholder="viral TikTok ramen but cheap and microwave-friendly"
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
            <label className="text-sm font-medium text-stone-800">
              Ingredients I have (optional, helps ranking)
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={2}
              placeholder="rice, eggs, frozen broccoli, chili crisp"
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </div>
        ) : mode === "have" ? (
          <div>
            <label className="text-sm font-medium text-stone-800">
              Ingredients you have
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={2}
              placeholder="rice, eggs, frozen peas, soy sauce, scallions"
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              className="mt-1 text-xs font-medium text-emerald-700 hover:underline"
              onClick={() =>
                setIngredients(
                  pantry
                    .map((p) => {
                      const found = INGREDIENTS.find(
                        (i) => i.id === p.ingredientId,
                      );
                      return found?.name;
                    })
                    .filter(Boolean)
                    .join(", "),
                )
              }
            >
              Use my pantry →
            </button>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-stone-800">
              What are you craving?
            </label>
            <textarea
              value={cravings}
              onChange={(e) => setCravings(e.target.value)}
              rows={2}
              placeholder="I want something like Korean fried rice but cheaper and healthier."
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setCravings(p)}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-stone-800">
              Budget per serving (${budget.toFixed(2)})
            </label>
            <input
              type="range"
              min={0.5}
              max={30}
              step={0.5}
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
              className="mt-2 w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-stone-500">
              <span>$0.50</span>
              <span>$30.00</span>
            </div>
            <label className="mt-3 block text-sm font-medium text-stone-800">
              Servings ({servings})
            </label>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value, 10))}
              className="mt-2 w-full accent-emerald-600"
            />
            <label className="mt-3 block text-sm font-medium text-stone-800">
              Time limit
            </label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="mt-1 w-full rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="under 10 minutes">Under 10 min</option>
              <option value="under 20 minutes">Under 20 min</option>
              <option value="under 30 minutes">Under 30 min</option>
              <option value="meal prep">Meal prep</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-800">Equipment</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EQUIPMENT_OPTS.map((eq) => (
                <Chip
                  key={eq}
                  active={equipment.includes(eq)}
                  onClick={() => setEquipment(toggleSet(equipment, eq))}
                >
                  {eq}
                </Chip>
              ))}
            </div>
            <label className="mt-3 block text-sm font-medium text-stone-800">
              Diet
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIET_OPTS.map((d) => (
                <Chip
                  key={d}
                  active={diet.includes(d)}
                  onClick={() => setDiet(toggleSet(diet, d))}
                >
                  {d}
                </Chip>
              ))}
            </div>
            <label className="mt-3 block text-sm font-medium text-stone-800">
              Creativity
            </label>
            <div className="mt-2 flex gap-2">
              {(["practical", "balanced", "creative"] as const).map((v) => (
                <Chip
                  key={v}
                  active={creativity === v}
                  onClick={() => setCreativity(v)}
                >
                  {v}
                </Chip>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-stone-800">
              <input
                type="checkbox"
                checked={autoImage}
                onChange={(e) => setAutoImage(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              Generate an image automatically
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <ThreeDButton
            variant="success"
            size="lg"
            block
            className="sm:w-auto"
            loading={loading}
            disabled={
              !isWorkerConfigured() ||
              (mode === "pantry" && selectedPantryIds.size === 0)
            }
            leftIcon={loading ? undefined : <Sparkles size={16} />}
            rightIcon={loading ? undefined : <ArrowRight size={14} />}
            haptic={false}
            onClick={() => {
              if (!loading) hapticMedium();
              if (mode === "pantry" || mode === "imagine" || mode === "have") {
                runOptions(false);
              } else {
                run();
              }
            }}
          >
            {loading
              ? "Thinking…"
              : mode === "pantry"
                ? `Generate from my pantry (${selectedPantryIds.size})`
                : "Generate my recipe"}
          </ThreeDButton>
          <p className="text-[11px] text-stone-500 sm:ml-2">
            <span className="font-semibold text-stone-700">4 options</span> · re-priced from your region · macros + grocery list built in
          </p>
          {recipe && (
            <>
              <Button
                onClick={() => run("regenerate with new creative angle")}
                variant="outline"
                leftIcon={<RefreshCw size={14} />}
              >
                Regenerate
              </Button>
              <Button
                onClick={() => run("make it cheaper")}
                variant="ghost"
                size="sm"
              >
                Cheaper
              </Button>
              <Button
                onClick={() => run("make it higher protein")}
                variant="ghost"
                size="sm"
              >
                Higher protein
              </Button>
              <Button
                onClick={() => run("make it faster")}
                variant="ghost"
                size="sm"
              >
                Faster
              </Button>
              <Button
                onClick={() => run("use fewer missing ingredients")}
                variant="ghost"
                size="sm"
              >
                Fewer missing items
              </Button>
            </>
          )}
        </div>
        </div>
      </section>

      {loading && !recipe && options.length === 0 && (
        <AIChefSteppedLoader
          label={
            mode === "url"
              ? "Reading the recipe URL"
              : mode === "paste"
                ? "Parsing the recipe text"
                : mode === "web"
                  ? "Searching the web"
                  : "Cooking up your four options"
          }
        />
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-2 text-sm text-red-800">
            <AlertCircle size={16} className="mt-0.5 flex-none" />
            <div>
              <p className="font-semibold">AI Chef couldn&apos;t finish.</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {webCandidates && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">
            Found on the web
          </h2>
          {webCandidates.length === 0 ? (
            <p className="text-sm text-stone-600">
              No good web matches. Try the &ldquo;Something creative&rdquo;
              mode for an original recipe.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {webCandidates.map((c, i) => (
                <Card key={`${c.sourceUrl}-${i}`} className="space-y-2">
                  <div>
                    <Badge tone="sky">
                      {c.sourceName ?? new URL(c.sourceUrl).hostname}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-stone-900">
                    {c.name}
                  </h3>
                  <p className="text-sm text-stone-600">{c.summary}</p>
                  <p className="text-xs text-stone-500">
                    {c.whyRecommended}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Open original →
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("url");
                        setImportUrl(c.sourceUrl);
                      }}
                      className="text-xs font-semibold text-stone-700 hover:underline"
                    >
                      Import &amp; adapt
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedOption && selectedOptionId && (
        <article className="space-y-5">
          {/* Option bubbles strip — floating liquid-glass tray. Single
              primary CTA (Generate more, basil 3D) + ghost Replace all
              so the choice hierarchy is obvious. */}
          <LiquidGlassPanel tone="grape" rounded="3xl" className="p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <SectionHeading
                eyebrow={
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={11} /> {options.length}{" "}
                    {options.length === 1 ? "option" : "options"}
                  </span>
                }
                title="Pick your favorite."
                tone="violet"
                className="flex-1"
              />
              <div className="flex flex-wrap items-center gap-2">
                <ThreeDButton
                  size="md"
                  variant="primary"
                  onClick={() => runOptions(true)}
                  disabled={loading || !isWorkerConfigured()}
                  title={!isWorkerConfigured() ? "AI Chef is offline — NEXT_PUBLIC_WORKER_URL not configured" : undefined}
                  loading={appending && loading}
                  leftIcon={<Sparkles size={14} />}
                >
                  {appending && loading ? "Generating…" : "Generate more"}
                </ThreeDButton>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => runOptions(false)}
                  disabled={loading || !isWorkerConfigured()}
                  leftIcon={<RefreshCw size={12} />}
                >
                  Replace all
                </Button>
              </div>
            </div>
            <GeneratedRecipeOptionBubbles
              options={options}
              selectedId={selectedOptionId}
              onSelect={selectOption}
              images={optionImages}
              generatingImageIds={generatingImageIds}
            />
          </LiquidGlassPanel>

          {/* Note: notesInfluenceSummary and whyThisFits are surfaced
              together as a BentoGrid further down — no standalone card. */}

          {/* Main recipe hero — image + overlay.
              Note: the empty / no-image state needs vertical room for the
              VisualEmptyState chip scene + body + CTA, so it renders as a
              normal-flow sibling (min-height instead of aspect-ratio).
              Only the image + "painting" loader keep the fixed 16:9. */}
          <div className="group overflow-hidden rounded-3xl shadow-md">
            {optionImages[selectedOptionId] ? (
              <div className="relative aspect-[16/9] bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optionImages[selectedOptionId]}
                  alt={selectedOption.recipe.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02]"
                />
                {/* Top-right overlay: AI badge + regenerate (image-only) */}
                <div className="absolute right-3 top-3 flex gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                    <Sparkles size={11} /> AI Generated
                  </span>
                  <button
                    onClick={() => generateImageForOption(selectedOption)}
                    disabled={generatingImageIds.has(selectedOptionId)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-stone-800 shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    title="Regenerate image"
                    aria-label="Regenerate image"
                  >
                    {generatingImageIds.has(selectedOptionId) ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <>
                        <RefreshCw size={10} /> Regenerate
                      </>
                    )}
                  </button>
                </div>
                {/* Bottom gradient + title (image-only) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                    {selectedOption.optionLabel.replace(/-/g, " ")}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
                    {selectedOption.recipe.name}
                  </h2>
                </div>
              </div>
            ) : generatingImageIds.has(selectedOptionId) ? (
              <div className="relative aspect-[16/9] bg-stone-100">
                <div className="flex h-full items-center justify-center text-stone-600">
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  <span className="text-sm">Painting your dish…</span>
                </div>
              </div>
            ) : (
              <div className="p-2 sm:p-4">
                <VisualEmptyState
                  icon={<ChefHat size={28} strokeWidth={2.4} />}
                  tone="grape"
                  title="Ready when you are."
                  body="Generate a food image for this recipe in a tap."
                  actions={
                    <ThreeDButton
                      variant="primary"
                      size="md"
                      leftIcon={<Sparkles size={12} />}
                      onClick={() => generateImageForOption(selectedOption)}
                    >
                      Generate image
                    </ThreeDButton>
                  }
                />
              </div>
            )}
            {imageError && (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                ⚠ {imageError}
              </div>
            )}
          </div>

          {/* 4-up StatCard dashboard replaces the flat stat strip —
              cost, time, calories, protein read like a recipe report card. */}
          <BentoGrid cols={4}>
            <StatCard
              icon={<Coins size={16} strokeWidth={2.4} />}
              tone="basil"
              value={`$${Number(selectedOption.recipe.estimatedCostPerServing).toFixed(2)}`}
              label="Per serving"
            />
            <StatCard
              icon={<Clock size={16} strokeWidth={2.4} />}
              tone="butter"
              value={selectedOption.recipe.totalTimeMinutes ?? "—"}
              label="Minutes"
            />
            <StatCard
              icon={<Flame size={16} strokeWidth={2.4} />}
              tone="carrot"
              value={Math.round(selectedOption.recipe.estimatedNutrition?.calories ?? 0)}
              label="Calories"
            />
            <StatCard
              icon={<Beef size={16} strokeWidth={2.4} />}
              tone="grape"
              value={`${Math.round(selectedOption.recipe.estimatedNutrition?.protein ?? 0)}g`}
              label="Protein"
            />
          </BentoGrid>

          <header className="space-y-3">
            {/* Title shows here only when there's no hero image — otherwise
                it's overlaid on the image hero above. */}
            {!optionImages[selectedOptionId] && (
              <h2 className="text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
                {selectedOption.recipe.name}
              </h2>
            )}
            {/* Color-coded chip row: difficulty (auto-tone) + up to 3
                equipment categories, each in its own palette via
                CategoryChip's MAP. */}
            <div className="flex flex-wrap gap-2">
              <CategoryChip category={selectedOption.recipe.difficulty}>
                {selectedOption.recipe.difficulty}
              </CategoryChip>
              {selectedOption.recipe.equipment?.slice(0, 3).map((eq) => (
                <CategoryChip key={eq} category={eq} />
              ))}
            </div>
            <p className="max-w-3xl text-base leading-relaxed text-stone-700">
              {selectedOption.recipe.description}
            </p>
            {/* Why-this-fits + notes-influence callouts converted to a
                2-up BentoGrid when both exist; single tile when only one
                — so we never ship an empty cell. */}
            {(() => {
              const why = selectedOption.recipe.whyThisFits;
              const notes = selectedOption.notesInfluenceSummary;
              const has = [
                why ? { icon: <Sparkles size={14} />, title: "Why this fits", body: why, tone: "basil" as const } : null,
                notes ? { icon: <ChefHat size={14} />, title: "Your notes shaped this", body: notes, tone: "grape" as const } : null,
              ].filter(Boolean) as Array<{ icon: React.ReactNode; title: string; body: string; tone: "basil" | "grape" }>;
              if (has.length === 0) return null;
              const renderTile = (c: typeof has[number], key: number) => (
                <div
                  key={key}
                  className={`flex h-full gap-3 rounded-2xl border p-4 shadow-sm ${
                    c.tone === "basil"
                      ? "border-[#B6E8CD] bg-[#F4FCF8]"
                      : "border-[#CDBEFF] bg-[#F6F3FF]"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid h-9 w-9 flex-none place-items-center rounded-xl text-white ${
                      c.tone === "basil" ? "bg-[#2FBF71]" : "bg-[#7C5CFF]"
                    }`}
                  >
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                        c.tone === "basil" ? "text-[#16834A]" : "text-[#3F2BB8]"
                      }`}
                    >
                      {c.title}
                    </p>
                    <p
                      className={`mt-1 text-sm leading-relaxed ${
                        c.tone === "basil" ? "text-[#0F5E33]" : "text-[#2A1B8A]"
                      }`}
                    >
                      {c.body}
                    </p>
                  </div>
                </div>
              );
              // Single tile → render directly so the layout doesn't ship
              // an empty grid cell next to it on mobile.
              if (has.length === 1) return renderTile(has[0], 0);
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  {has.map((c, i) => renderTile(c, i))}
                </div>
              );
            })()}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {optionSavedIds[selectedOption.id] && (
                <>
                  <ThreeDLink
                    href={`/recipes/custom?id=${optionSavedIds[selectedOption.id]}`}
                    variant="primary"
                    size="md"
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Open full page
                  </ThreeDLink>
                  <button
                    type="button"
                    onClick={() =>
                      toggleSaved(optionSavedIds[selectedOption.id])
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E8D8C4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#241A12] transition-all hover:-translate-y-px hover:border-[#B6E8CD] hover:text-[#16834A]"
                  >
                    {isSaved(optionSavedIds[selectedOption.id]) ? (
                      <>
                        <BookmarkCheck size={14} className="text-[#2FBF71]" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark size={14} /> Save recipe
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
            <div className="pt-2">
              <LogGeneratedRecipeButton
                recipe={selectedOption.recipe}
                savedId={optionSavedIds[selectedOption.id]}
              />
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden">
              <SectionHeading
                eyebrow={
                  <span className="inline-flex items-center gap-1.5">
                    <ShoppingBasket size={11} /> Ingredients
                  </span>
                }
                title={`${selectedOption.recipe.ingredients.length} items`}
                tone="emerald"
              />
              <ul className="mt-3 divide-y divide-stone-100">
                {selectedOption.recipe.ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm motion-safe:animate-[fadeUp_400ms_ease-out_both]"
                    style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 font-medium text-stone-900">
                        {ing.name}
                        {ing.userAlreadyHas && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <Check size={9} /> you have
                          </span>
                        )}
                        {ing.optional && (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                            optional
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {ing.quantity} {ing.unit}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-stone-900">
                      ${money(ing.estimatedCost)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <SectionHeading
                eyebrow={
                  <span className="inline-flex items-center gap-1.5">
                    <ChefHat size={11} /> Steps
                  </span>
                }
                title={`${selectedOption.recipe.steps.length} steps`}
                tone="amber"
              />
              <ol className="mt-3 space-y-3">
                {selectedOption.recipe.steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm motion-safe:animate-[fadeUp_400ms_ease-out_both]"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white shadow-sm shadow-emerald-200">
                      {i + 1}
                    </span>
                    <p className="leading-relaxed text-stone-800">{s}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </article>
      )}

      {recipe && savedId && (
        <article className="space-y-6">
          {sourceMeta && (
            <Card className="border-sky-200 bg-sky-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
                Recipe sources
              </p>
              <p className="mt-1 text-sm text-sky-900">
                {sourceMeta.attributionText}
              </p>
              {sourceMeta.sourceUrl && (
                <a
                  href={sourceMeta.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-sky-700 hover:underline"
                >
                  Open original source →
                </a>
              )}
            </Card>
          )}
          <div className="group overflow-hidden rounded-3xl shadow-md">
            <div className="relative aspect-[16/9] bg-stone-100">
              {savedImageDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={savedImageDataUrl}
                  alt={recipe.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02]"
                />
              ) : imageLoading ? (
                <div className="flex h-full items-center justify-center text-stone-600">
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  <span className="text-sm">Painting your dish…</span>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-violet-100 via-emerald-50 to-amber-50 text-stone-500">
                  <ChefHat size={48} />
                  <p className="mt-2 text-xs uppercase tracking-wide">
                    Image not generated
                  </p>
                </div>
              )}
              <div className="absolute right-3 top-3 flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                  <Sparkles size={11} /> AI Generated
                </span>
              </div>
              {savedImageDataUrl && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                  />
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                      AI Chef
                    </p>
                    <h2 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
                      {recipe.name}
                    </h2>
                  </div>
                </>
              )}
            </div>
          </div>

          <RecipeStatsRow
            costPerServing={Number(recipe.estimatedCostPerServing)}
            totalTimeMinutes={recipe.totalTimeMinutes}
            calories={recipe.estimatedNutrition?.calories}
            protein={recipe.estimatedNutrition?.protein}
            carbs={recipe.estimatedNutrition?.carbs}
            servings={recipe.servings}
          />

          <header className="space-y-3">
            {!savedImageDataUrl && (
              <h2 className="text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
                {recipe.name}
              </h2>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge tone="stone" icon={<Flame size={12} />}>
                {recipe.difficulty}
              </Badge>
              {recipe.equipment?.slice(0, 3).map((eq) => (
                <Badge key={eq} tone="sky">
                  {eq}
                </Badge>
              ))}
            </div>
            <p className="max-w-3xl text-base leading-relaxed text-stone-700">
              {recipe.description}
            </p>
            {recipe.whyThisFits && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Why this fits your request
                </p>
                <p className="mt-1">{recipe.whyThisFits}</p>
              </div>
            )}
            <Link
              href="/recipe-studio"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              title="This recipe is stored in your Recipe Studio until you delete it"
            >
              <BookmarkCheck size={12} /> Saved to Recipe Studio
            </Link>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                onClick={() => toggleSaved(savedId)}
                variant="outline"
                size="sm"
                leftIcon={
                  isSaved(savedId) ? (
                    <BookmarkCheck size={14} className="text-emerald-600" />
                  ) : (
                    <Bookmark size={14} />
                  )
                }
              >
                {isSaved(savedId) ? "Saved" : "Save recipe"}
              </Button>
              {(recipe.missingIngredients?.length ?? 0) > 0 && (
                <Button
                  onClick={addAllMissingToGrocery}
                  size="sm"
                  variant="secondary"
                  leftIcon={<ShoppingBasket size={14} />}
                >
                  Add {recipe.missingIngredients!.length} missing to grocery list
                </Button>
              )}
              <Link
                href={`/recipes/custom?id=${savedId}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                Open full page <ArrowRight size={14} />
              </Link>
            </div>
            <div className="pt-2">
              <LogGeneratedRecipeButton recipe={recipe} savedId={savedId} />
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
                Ingredients
              </h3>
              <ul className="mt-3 divide-y divide-stone-100">
                {recipe.ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <p
                        className={
                          ing.userAlreadyHas
                            ? "font-medium text-emerald-700"
                            : "font-medium text-stone-800"
                        }
                      >
                        {ing.name} {ing.optional && (
                          <span className="text-xs text-stone-500">(optional)</span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        {ing.quantity} {ing.unit}
                        {ing.userAlreadyHas && " · you have"}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-stone-900">
                      ${money(ing.estimatedCost)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
                Steps
              </h3>
              <ol className="mt-3 space-y-3">
                {recipe.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p>{s}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {(recipe.missingIngredients?.length ?? 0) > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
                Missing ingredients
              </h3>
              <ul className="mt-3 divide-y divide-amber-100">
                {recipe.missingIngredients!.map((m, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-stone-900">{m.name}</p>
                      <p className="text-xs text-stone-600">
                        {m.importance}
                        {m.cheapSubstitute ? ` · or use ${m.cheapSubstitute}` : ""}
                      </p>
                    </div>
                    <p className="font-medium text-stone-900">
                      ${money(m.estimatedCost)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </article>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 transition-all motion-safe:scale-[1.02]"
          : "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 active:translate-y-0"
      }
    >
      {children}
    </button>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-2xl border border-emerald-600 bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition-all motion-safe:scale-[1.02]"
          : "inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 active:translate-y-0"
      }
    >
      {children}
    </button>
  );
}
