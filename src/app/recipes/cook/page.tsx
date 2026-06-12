"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Clock,
  CookingPot,
  Droplets,
  Flame,
  ImagePlus,
  Layers,
  Loader2,
  Microwave,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Salad,
  Scissors,
  Sparkles,
  Timer as TimerIcon,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getCustomRecipe,
  getStoredRecipeImage,
  imageDataUrl,
  saveCustomRecipe,
  storeRecipeImage,
} from "@/lib/customRecipeStorage";
import type { CustomRecipe } from "@/lib/customRecipeTypes";
import {
  ARCHETYPE_META,
  classifyStep,
  extractStepTitle,
  type StepArchetype,
} from "@/lib/cookStepArchetypes";
import {
  generateRecipeImage,
  isWorkerConfigured,
} from "@/lib/workerClient";

const ICON_FOR: Record<StepArchetype, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  prep: Salad,
  chop: Scissors,
  mix: RefreshCw,
  season: Sparkles,
  sear: Flame,
  boil: Droplets,
  simmer: CookingPot,
  bake: ChefHat,
  microwave: Microwave,
  rest: Clock,
  plate: Utensils,
  assemble: Layers,
  garnish: Sparkles,
};

interface NormalizedStep {
  index: number;
  title: string;
  instruction: string;
  archetype: StepArchetype;
  timerMinutes: number | null;
  safetyNote?: string | null;
  // Per-step AI photo, if the user opted in. Stored under
  // srf:cook-step-images keyed by `${recipeId}:${index}`.
  photoSrc?: string;
}

const STEP_IMAGES_KEY = "srf:cook-step-images";

interface StepImageMap {
  // key: `${recipeId}:${stepIndex}`, value: data URL or remote URL
  [key: string]: string;
}

function readStepImages(): StepImageMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STEP_IMAGES_KEY);
    return raw ? (JSON.parse(raw) as StepImageMap) : {};
  } catch {
    return {};
  }
}

function writeStepImages(map: StepImageMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STEP_IMAGES_KEY, JSON.stringify(map));
  } catch {
    // quota — silently fall through; the hero photo is still saved.
  }
}

function normalizeSteps(r: CustomRecipe): NormalizedStep[] {
  const guided = r.guidedCookingSteps;
  const strings = r.steps || [];
  // Prefer the guided steps when present — they already split into a title
  // + detailed instruction + timer. Fall back to the plain `steps` array.
  if (guided && guided.length > 0) {
    return guided.map((g, i) => {
      const instruction = g.instruction || "";
      const title = g.title?.trim() || extractStepTitle(instruction);
      return {
        index: i,
        title,
        instruction,
        archetype: classifyStep(instruction || title),
        timerMinutes: g.timerMinutes ?? null,
        safetyNote: g.safetyNote,
      };
    });
  }
  return strings.map((s, i) => ({
    index: i,
    title: extractStepTitle(s),
    instruction: s,
    archetype: classifyStep(s),
    timerMinutes: extractTimer(s),
  }));
}

// Pull "for 5 minutes" / "for about 10 min" out of a step string so the
// timer button has a sensible default even when the AI didn't break the
// step out into a guidedCookingStep with timerMinutes.
function extractTimer(s: string): number | null {
  const m = s.match(/(\d+)\s*(?:to\s*\d+\s*)?(?:min|minute|minutes)\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 && n <= 120 ? n : null;
}

export default function CookPageWrapper() {
  return (
    <Suspense fallback={<div className="text-stone-500">Loading…</div>}>
      <CookPage />
    </Suspense>
  );
}

function CookPage() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [recipe, setRecipe] = useState<CustomRecipe | null>(null);
  const [heroSrc, setHeroSrc] = useState<string | null>(null);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [generatingSteps, setGeneratingSteps] = useState<Set<number>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!id) {
      setRecipe(null);
      setHeroSrc(null);
      return;
    }
    const r = getCustomRecipe(id);
    setRecipe(r ?? null);
    if (r) {
      let src = r.image?.src;
      if (!src) {
        const stored = getStoredRecipeImage(id);
        if (stored?.b64) src = imageDataUrl(stored.b64);
      }
      setHeroSrc(src ?? null);
    } else {
      setHeroSrc(null);
    }
    // Restore per-step photos for this recipe from localStorage
    const all = readStepImages();
    const mine: Record<number, string> = {};
    for (const [key, v] of Object.entries(all)) {
      if (key.startsWith(`${id}:`)) {
        const i = parseInt(key.split(":")[1] ?? "-1", 10);
        if (Number.isFinite(i)) mine[i] = v;
      }
    }
    setStepImages(mine);
  }, [id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const steps = useMemo<NormalizedStep[]>(
    () => (recipe ? normalizeSteps(recipe) : []),
    [recipe],
  );

  async function generateStepPhoto(step: NormalizedStep) {
    if (!recipe) return;
    setPhotoError(null);
    setGeneratingSteps((s) => new Set(s).add(step.index));
    try {
      const img = await generateRecipeImage({
        recipeName: recipe.name,
        ingredients: recipe.ingredients.map((i) => i.name).slice(0, 8),
        method: recipe.primaryCookingMethod,
        // Bias the image gen toward the action of this specific step.
        prompt: `Step ${step.index + 1} of cooking ${recipe.name}: ${step.instruction}. Top-down hand-held phone photo, warm natural light, in-progress, hands or utensils visible, no humans' faces, no text overlays.`,
      });
      let src: string | undefined;
      if (img.b64_json) {
        // Reuse the recipe-image store for accounting / eviction. Key the
        // step image with a `${recipeId}::step::${index}` synthetic id so
        // it lives in the same total-bytes budget but doesn't collide.
        const syntheticId = `${recipe.id}::step::${step.index}`;
        const stored = storeRecipeImage(syntheticId, img.b64_json, {
          prompt: img.prompt,
          model: img.model,
        });
        if (stored.ok) src = imageDataUrl(img.b64_json);
      } else if (img.url) {
        src = img.url;
      }
      if (!src) throw new Error("No image returned");
      setStepImages((m) => ({ ...m, [step.index]: src as string }));
      const all = readStepImages();
      writeStepImages({ ...all, [`${recipe.id}:${step.index}`]: src });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setPhotoError(
        /verified|verification|organization|403|401/i.test(msg)
          ? "Image generation needs OpenAI organization verification at platform.openai.com/settings/organization/general."
          : msg,
      );
    } finally {
      setGeneratingSteps((s) => {
        const next = new Set(s);
        next.delete(step.index);
        return next;
      });
    }
  }

  async function generateAllStepPhotos() {
    if (!recipe || steps.length === 0) return;
    const missing = steps.filter((s) => !stepImages[s.index]);
    if (missing.length === 0) return;
    setBulkProgress({ done: 0, total: missing.length });
    // Sequential — image generation hits the same worker / rate-limited
    // OpenAI org. Two-in-flight is OK but 6 simultaneous often 429s.
    let done = 0;
    for (const step of missing) {
      await generateStepPhoto(step);
      done += 1;
      setBulkProgress({ done, total: missing.length });
    }
    setBulkProgress(null);
  }

  async function handleRegenerateHero() {
    if (!recipe || !isWorkerConfigured()) return;
    setPhotoError(null);
    try {
      const img = await generateRecipeImage({
        recipeName: recipe.name,
        ingredients: recipe.ingredients.map((i) => i.name).slice(0, 8),
        method: recipe.primaryCookingMethod,
      });
      let src: string | undefined;
      if (img.b64_json) {
        const stored = storeRecipeImage(recipe.id, img.b64_json, {
          prompt: img.prompt,
          model: img.model,
        });
        if (stored.ok) src = imageDataUrl(img.b64_json);
      } else if (img.url) {
        src = img.url;
      }
      if (!src) throw new Error("No image returned");
      setHeroSrc(src);
      saveCustomRecipe({
        ...recipe,
        image: {
          src,
          alt: recipe.name,
          sourceName: "AI generated",
          license: "Generated image",
          isAIGenerated: true,
          isFallback: false,
          generatedPrompt: img.prompt,
          generatedAt: new Date().toISOString(),
          model: img.model,
        },
      });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Image generation failed");
    }
  }

  if (!id || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-white px-6 py-20 text-center">
        <div className="mb-3 text-6xl" aria-hidden>
          🍳
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Recipe not found</h1>
        <p className="mt-2 max-w-md text-sm text-stone-600">
          Open a recipe from{" "}
          <Link href="/saved" className="text-emerald-700 underline">
            Saved
          </Link>{" "}
          first, then come back to cook it.
        </p>
      </div>
    );
  }

  const totalMinutes = recipe.totalTimeMinutes ?? 0;
  const photoedSteps = steps.filter((s) => stepImages[s.index]).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/recipes/custom?id=${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-emerald-700"
        >
          <ArrowLeft size={14} /> Back to recipe
        </Link>
        <Badge tone="violet">
          <ChefHat size={11} className="mr-1" /> Cook mode
        </Badge>
      </div>

      <header className="rounded-3xl bg-gradient-to-br from-[#F9F6EF] to-[#FFF7E5] p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7A4A00]">
          {steps.length} steps · ~{totalMinutes} min
        </p>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 sm:text-4xl">
          {recipe.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-700 sm:text-base">
          Scroll through each step. Tap the timer button on any step with a
          countdown. The final card shows the plated dish.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            onClick={generateAllStepPhotos}
            size="sm"
            disabled={
              !isWorkerConfigured() ||
              bulkProgress !== null ||
              photoedSteps === steps.length
            }
            leftIcon={
              bulkProgress ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ImagePlus size={14} />
              )
            }
          >
            {bulkProgress
              ? `Generating ${bulkProgress.done + 1}/${bulkProgress.total}…`
              : photoedSteps === steps.length
                ? "All steps have photos"
                : photoedSteps > 0
                  ? `Generate ${steps.length - photoedSteps} more photo${steps.length - photoedSteps === 1 ? "" : "s"}`
                  : "Generate AI photo for every step"}
          </Button>
          {photoedSteps === 0 && !bulkProgress && (
            <span className="text-xs text-stone-500">
              Free icons by default · paid AI photos optional
            </span>
          )}
        </div>
        {photoError && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {photoError}
          </div>
        )}
      </header>

      <ol className="space-y-5 snap-y snap-mandatory">
        {steps.map((step, i) => (
          <StepCard
            key={i}
            step={step}
            recipeName={recipe.name}
            photoSrc={stepImages[step.index]}
            isLast={i === steps.length - 1}
            heroSrc={heroSrc}
            onGeneratePhoto={() => generateStepPhoto(step)}
            isGenerating={generatingSteps.has(step.index)}
          />
        ))}
      </ol>

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
        <Salad size={28} className="mx-auto text-emerald-700" />
        <h2 className="mt-3 text-lg font-bold text-emerald-900">
          You&apos;re done — enjoy!
        </h2>
        <p className="mt-1 text-sm text-emerald-800/80">
          Tap below to mark it cooked or jump back to the recipe.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/recipes/custom?id=${id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Back to recipe <ArrowRight size={14} />
          </Link>
          {heroSrc && (
            <button
              type="button"
              onClick={handleRegenerateHero}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              <RefreshCw size={14} /> Regenerate cover photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  recipeName,
  photoSrc,
  isLast,
  heroSrc,
  onGeneratePhoto,
  isGenerating,
}: {
  step: NormalizedStep;
  recipeName: string;
  photoSrc?: string;
  isLast: boolean;
  heroSrc: string | null;
  onGeneratePhoto: () => void;
  isGenerating: boolean;
}) {
  const meta = ARCHETYPE_META[step.archetype];
  const Icon = ICON_FOR[step.archetype];
  // For the LAST step, the hero photo IS the visual — that's the plated
  // dish the user is working toward. For mid steps we default to the
  // archetype icon and only show a photo if the user opted in.
  const showHero = isLast && !photoSrc && heroSrc;

  return (
    <li
      className="scroll-mt-24 snap-start overflow-hidden rounded-3xl border border-[#E8D8C4] bg-white shadow-sm"
      style={{ borderLeftWidth: 6, borderLeftColor: meta.accent }}
    >
      <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-12 w-12 flex-none place-items-center rounded-2xl ${meta.bg} ${meta.fg}`}
            >
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${meta.fg}`}
              >
                Step {step.index + 1} · {meta.label}
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-stone-900">
                {step.title}
              </h3>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-stone-800">
            {step.instruction}
          </p>

          {step.safetyNote && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              ⚠ {step.safetyNote}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {step.timerMinutes && step.timerMinutes > 0 ? (
              <InlineTimer minutes={step.timerMinutes} />
            ) : null}
            {!photoSrc && !isLast && (
              <button
                type="button"
                onClick={onGeneratePhoto}
                disabled={isGenerating || !isWorkerConfigured()}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-emerald-400 hover:text-emerald-800 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <ImagePlus size={12} /> Add AI photo
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div
          className={`relative min-h-[180px] ${meta.bg}`}
          aria-hidden={!photoSrc && !showHero}
        >
          {photoSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc}
                alt={`${recipeName} – step ${step.index + 1}: ${step.title}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </>
          ) : showHero && heroSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroSrc}
                alt={`${recipeName} plated`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Plate up
                </p>
              </div>
            </>
          ) : (
            <div
              className={`flex h-full flex-col items-center justify-center gap-3 p-6 ${meta.fg}`}
            >
              <Icon size={72} strokeWidth={1.4} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                {meta.label}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function InlineTimer({ minutes }: { minutes: number }) {
  const total = Math.round(minutes * 60);
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    lastTickRef.current = null;
    const tick = (ts: number) => {
      if (lastTickRef.current === null) lastTickRef.current = ts;
      const delta = (ts - lastTickRef.current) / 1000;
      lastTickRef.current = ts;
      setRemaining((r) => {
        const next = r - delta;
        if (next <= 0) {
          setRunning(false);
          return 0;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const m = Math.floor(remaining / 60);
  const s = Math.floor(remaining % 60);
  const display = `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">
      <TimerIcon size={12} className="opacity-80" />
      <span className="tabular-nums">{display}</span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
        aria-label={running ? "Pause timer" : "Start timer"}
      >
        {running ? <Pause size={11} /> : <Play size={11} />}
      </button>
      {remaining < total && (
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(total);
          }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          aria-label="Reset timer"
        >
          <RotateCcw size={11} />
        </button>
      )}
    </div>
  );
}
