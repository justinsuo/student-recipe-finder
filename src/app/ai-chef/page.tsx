"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  ChefHat,
  Loader2,
  RefreshCw,
  Coins,
  Clock,
  Flame,
  ShoppingBasket,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  ArrowRight,
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
import { Refrigerator } from "lucide-react";

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
  "no-kitchen",
];

const DIET_OPTS = ["vegetarian", "vegan", "high-protein", "gluten-free", "dairy-free"];

export default function AIChefPageWrapper() {
  return (
    <Suspense fallback={<div className="text-stone-500">Loading…</div>}>
      <AIChefPage />
    </Suspense>
  );
}

function AIChefPage() {
  const searchParams = useSearchParams();
  const { addGroceryItems, toggleSaved, isSaved, pantry } = useAppStore();

  const [mode, setMode] = useState<"pantry" | "have" | "imagine" | "web" | "url" | "paste">(
    () => (searchParams.get("usePantry") === "true" ? "pantry" : "have"),
  );
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
  const [equipment, setEquipment] = useState<string[]>(["microwave", "stovetop"]);
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
    const r = o.recipe;
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
      const res = await generateRecipeOptions({
        pantryIngredients: pantryNames,
        selectedPantryIngredientIds: Array.from(selectedPantryIds),
        aiNotes: aiNotes.trim() || undefined,
        cravingText: cravings.trim() || undefined,
        budgetPerServing: budget,
        servings,
        equipment,
        dietTags: diet,
        creativityLevel: creativity,
        appendToExisting: append,
        previousOptions: append
          ? options.map((o) => ({ recipe: { name: o.recipe.name } }))
          : undefined,
      });
      const merged = append ? [...options, ...res.options] : res.options;
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
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
    void items;
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <ChefHat size={14} /> AI Chef
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
          Tell the AI what you have. Get a cheap recipe.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Generates an original recipe based on your ingredients, budget, gear,
          diet, and cravings — including an AI-generated photo.
        </p>
      </header>

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

      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
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
                Tap a chip to include or exclude it from this recipe. The X
                removes the item from your pantry entirely.
              </p>
            </div>
            <AIChefPantrySelector
              selectedIds={selectedPantryIds}
              onChange={setSelectedPantryIds}
            />
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
              max={6}
              step={0.25}
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
              className="mt-2 w-full accent-emerald-600"
            />
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

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            onClick={() => (mode === "pantry" || mode === "imagine" || mode === "have" ? runOptions(false) : run())}
            disabled={
              loading ||
              !isWorkerConfigured() ||
              (mode === "pantry" && selectedPantryIds.size === 0)
            }
            leftIcon={
              loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )
            }
          >
            {loading
              ? "Thinking…"
              : mode === "pantry"
                ? `Generate from my pantry (${selectedPantryIds.size})`
                : "Generate my recipe"}
          </Button>
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
      </section>

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
        <article className="space-y-4">
          {/* Option bubbles strip */}
          <div className="rounded-3xl border border-stone-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
                Your options ({options.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runOptions(true)}
                  disabled={loading}
                  leftIcon={
                    appending && loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )
                  }
                >
                  {appending && loading ? "Generating…" : "Generate more options"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => runOptions(false)}
                  disabled={loading}
                  leftIcon={<RefreshCw size={14} />}
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
          </div>

          {/* Notes influence summary */}
          {selectedOption.notesInfluenceSummary && (
            <Card className="border-violet-200 bg-violet-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
                How your notes influenced this recipe
              </p>
              <p className="mt-1 text-sm text-violet-900">
                {selectedOption.notesInfluenceSummary}
              </p>
            </Card>
          )}

          {/* Main recipe panel */}
          <div className="overflow-hidden rounded-3xl shadow-sm">
            <div className="relative aspect-[16/9] bg-stone-100">
              {optionImages[selectedOptionId] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={optionImages[selectedOptionId]}
                  alt={selectedOption.recipe.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : generatingImageIds.has(selectedOptionId) ? (
                <div className="flex h-full items-center justify-center text-stone-600">
                  <Loader2 size={20} className="mr-2 animate-spin" /> Generating
                  recipe image…
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-50 text-stone-500">
                  <ChefHat size={48} />
                  <button
                    onClick={() => generateImageForOption(selectedOption)}
                    className="mt-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Generate image
                  </button>
                </div>
              )}
              <div className="absolute right-3 top-3 flex gap-2">
                <Badge tone="violet">
                  <Sparkles size={11} className="mr-1" /> AI Generated
                </Badge>
                {optionImages[selectedOptionId] && (
                  <button
                    onClick={() => generateImageForOption(selectedOption)}
                    disabled={generatingImageIds.has(selectedOptionId)}
                    className="rounded-full bg-stone-900/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-stone-900"
                    title="Regenerate image"
                  >
                    {generatingImageIds.has(selectedOptionId) ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      "Regenerate"
                    )}
                  </button>
                )}
              </div>
            </div>
            {imageError && (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                ⚠ {imageError}
              </div>
            )}
          </div>

          <header className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green" icon={<Coins size={12} />}>
                ${selectedOption.recipe.estimatedCostPerServing.toFixed(2)}/serving
              </Badge>
              <Badge tone="amber" icon={<Clock size={12} />}>
                {selectedOption.recipe.totalTimeMinutes} min
              </Badge>
              <Badge tone="stone" icon={<Flame size={12} />}>
                {selectedOption.recipe.difficulty}
              </Badge>
            </div>
            <h2 className="text-3xl font-bold text-stone-900">
              {selectedOption.recipe.name}
            </h2>
            <p className="text-stone-700">{selectedOption.recipe.description}</p>
            {selectedOption.recipe.whyThisFits && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Why this fits your request
                </p>
                <p className="mt-1">{selectedOption.recipe.whyThisFits}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {optionSavedIds[selectedOption.id] && (
                <>
                  <Button
                    onClick={() =>
                      toggleSaved(optionSavedIds[selectedOption.id])
                    }
                    variant="outline"
                    size="sm"
                    leftIcon={
                      isSaved(optionSavedIds[selectedOption.id]) ? (
                        <BookmarkCheck size={14} className="text-emerald-600" />
                      ) : (
                        <Bookmark size={14} />
                      )
                    }
                  >
                    {isSaved(optionSavedIds[selectedOption.id])
                      ? "Saved"
                      : "Save recipe"}
                  </Button>
                  <Link
                    href={`/recipes/custom?id=${optionSavedIds[selectedOption.id]}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    Open full page <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
                Ingredients
              </h3>
              <ul className="mt-3 divide-y divide-stone-100">
                {selectedOption.recipe.ingredients.map((ing, i) => (
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
                        {ing.name}{" "}
                        {ing.optional && (
                          <span className="text-xs text-stone-500">(optional)</span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        {ing.quantity} {ing.unit}
                        {ing.userAlreadyHas && " · you have"}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-stone-900">
                      ${ing.estimatedCost.toFixed(2)}
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
                {selectedOption.recipe.steps.map((s, i) => (
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
          <div className="overflow-hidden rounded-3xl shadow-sm">
            <div className="relative aspect-[16/9] bg-stone-100">
              {savedImageDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={savedImageDataUrl}
                  alt={recipe.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : imageLoading ? (
                <div className="flex h-full items-center justify-center text-stone-600">
                  <Loader2 size={20} className="mr-2 animate-spin" /> Generating
                  recipe image…
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-50 text-stone-500">
                  <ChefHat size={48} />
                  <p className="mt-2 text-xs uppercase tracking-wide">
                    Image not generated
                  </p>
                </div>
              )}
              <div className="absolute right-3 top-3 flex gap-2">
                <Badge tone="violet">
                  <Sparkles size={11} className="mr-1" /> AI Generated
                </Badge>
              </div>
            </div>
          </div>

          <header className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green" icon={<Coins size={12} />}>
                ${recipe.estimatedCostPerServing.toFixed(2)}/serving
              </Badge>
              <Badge tone="amber" icon={<Clock size={12} />}>
                {recipe.totalTimeMinutes} min
              </Badge>
              <Badge tone="stone" icon={<Flame size={12} />}>
                {recipe.difficulty}
              </Badge>
            </div>
            <h2 className="text-3xl font-bold text-stone-900">{recipe.name}</h2>
            <p className="text-stone-700">{recipe.description}</p>
            {recipe.whyThisFits && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Why this fits your request
                </p>
                <p className="mt-1">{recipe.whyThisFits}</p>
              </div>
            )}
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
                      ${ing.estimatedCost.toFixed(2)}
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
                      ${m.estimatedCost.toFixed(2)}
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
      className={
        active
          ? "rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
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
      className={
        active
          ? "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          : "rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
      }
    >
      {children}
    </button>
  );
}
