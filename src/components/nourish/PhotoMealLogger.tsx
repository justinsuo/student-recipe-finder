"use client";

import { useState, useRef } from "react";
import { clsx } from "clsx";
import {
  Camera,
  Upload,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Pencil,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectablePill } from "@/components/ui/SelectablePill";
import {
  isAiLoggingEnabled,
  identifyMealComponents,
  identifyMealFromText,
  HIDDEN_EXTRAS,
} from "@/lib/nourish/aiMealLogger";
import {
  groundComponentsInUsda,
  rescaleComponent,
  sumGroundedMacros,
} from "@/lib/nourish/mealEstimator";
import { addDiaryEntry, newId, todayString } from "@/lib/nourish/storage";
import type { GroundedComponent } from "@/lib/nourish/mealEstimator";
import type { MealSlot } from "@/lib/nourish/types";

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

type InputMode = "photo" | "text";
type State = "idle" | "identifying" | "grounding" | "review" | "error";

interface Props {
  onLogged: () => void;
}

// ─── Per-component row ────────────────────────────────────────────────────────

function ComponentRow({
  component,
  onChange,
  onRemove,
}: {
  component: GroundedComponent;
  onChange: (updated: GroundedComponent) => void;
  onRemove: () => void;
}) {
  const [editingGrams, setEditingGrams] = useState(false);
  const [gramsInput, setGramsInput] = useState(String(component.grams));

  function commitGrams() {
    const g = parseFloat(gramsInput);
    if (!isNaN(g) && g > 0) {
      onChange(rescaleComponent(component, g));
    } else {
      setGramsInput(String(component.grams));
    }
    setEditingGrams(false);
  }

  const confidenceColor =
    component.aiConfidence === "high"
      ? "text-emerald-600"
      : component.aiConfidence === "medium"
        ? "text-amber-600"
        : "text-stone-400";

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 truncate">{component.aiName}</p>
          {component.usdaFood && (
            <p className="text-[10px] text-stone-400 truncate">
              via USDA: {component.usdaFood.name}
            </p>
          )}
          {!component.usdaFood && (
            <p className="text-[10px] text-amber-600">No USDA match — macros estimated</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove item"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-stone-400 hover:bg-rose-50 hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Gram adjuster */}
        <div className="flex items-center gap-1.5">
          {editingGrams ? (
            <input
              type="text"
              inputMode="decimal"
              value={gramsInput}
              autoFocus
              onChange={(e) => setGramsInput(e.target.value)}
              onBlur={commitGrams}
              onKeyDown={(e) => { if (e.key === "Enter") commitGrams(); }}
              className="w-16 rounded-lg border border-emerald-400 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          ) : (
            <button
              type="button"
              onClick={() => { setGramsInput(String(component.grams)); setEditingGrams(true); }}
              className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-0.5 text-xs text-stone-700 hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {component.grams}g <Pencil size={9} className="text-stone-400" />
            </button>
          )}
          <span className={clsx("text-[10px]", confidenceColor)}>
            {component.aiConfidence}
          </span>
        </div>

        {/* Scaled macros */}
        {component.scaled ? (
          <div className="text-[11px] text-stone-600 tabular-nums">
            <span className="font-semibold text-stone-800">{component.scaled.kcal} kcal</span>
            {" · "}{component.scaled.proteinG}g P
            {" · "}{component.scaled.carbG}g C
            {" · "}{component.scaled.fatG}g F
          </div>
        ) : (
          <p className="text-[11px] text-stone-400 italic">macros unavailable</p>
        )}
      </div>

      {/* Estimation basis */}
      <p className="text-[10px] text-stone-400 italic leading-relaxed">{component.estimationBasis}</p>

      {/* Hidden calorie note from AI */}
      {component.usdaFood === null && !component.scaled && (
        <p className="text-[10px] text-amber-600">
          Add manually or swap for a USDA food to get macros.
        </p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PhotoMealLogger({ onLogged }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>("photo");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [components, setComponents] = useState<GroundedComponent[]>([]);
  const [meal, setMeal] = useState<MealSlot>("lunch");
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const [logged, setLogged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiEnabled = isAiLoggingEnabled();
  const totals = sumGroundedMacros(components);

  async function processImage(file: File) {
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }

    const canvas = document.createElement("canvas");
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    try {
      img.src = objectUrl;
      // Resolve on load; reject on decode error so we don't hang forever
      // on a corrupted upload.
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image decode failed"));
      });
    } catch {
      URL.revokeObjectURL(objectUrl);
      setError("Couldn't read that image. Try another file.");
      return;
    }
    URL.revokeObjectURL(objectUrl);

    const MAX = 768;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];

    setPreview(dataUrl);
    await runPipeline(() => identifyMealComponents(base64, "image/jpeg", description || undefined));
  }

  async function processText() {
    if (description.trim().length < 3) { setError("Please describe your meal."); return; }
    await runPipeline(() => identifyMealFromText(description));
  }

  async function runPipeline(identifyFn: () => ReturnType<typeof identifyMealComponents>) {
    setState("identifying");
    setError(null);
    try {
      const { components: raw } = await identifyFn();
      if (raw.length === 0) {
        setState("error");
        setError("Couldn't identify any food — try adding a description or using manual search.");
        return;
      }
      setState("grounding");
      const grounded = await groundComponentsInUsda(raw);
      setComponents(grounded);
      setState("review");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "AI logging failed");
    }
  }

  function handleLog() {
    const today = todayString();
    const tot = sumGroundedMacros(components);
    // Log as a single aggregated entry so the diary stays clean
    addDiaryEntry({
      id: newId(),
      date: today,
      meal,
      food: {
        id: `ai-meal-${newId()}`,
        source: "custom",
        name: inputMode === "text" && description ? description.slice(0, 60) : "Photo meal",
        servingDescription: `${components.length} item${components.length !== 1 ? "s" : ""} (AI estimate)`,
        kcal: tot.kcal,
        proteinG: tot.proteinG,
        carbG: tot.carbG,
        fatG: tot.fatG,
      },
      quantityServings: 1,
      snapshotKcal: tot.kcal,
      snapshotProteinG: tot.proteinG,
      snapshotCarbG: tot.carbG,
      snapshotFatG: tot.fatG,
      loggedAt: new Date().toISOString(),
    });
    setLogged(true);
    setTimeout(() => {
      setLogged(false);
      setState("idle");
      setComponents([]);
      setPreview(null);
      setDescription("");
      setShowExtras(false);
      onLogged();
    }, 1200);
  }

  function reset() {
    setState("idle");
    setComponents([]);
    setPreview(null);
    setError(null);
    setDescription("");
    setShowExtras(false);
    setLogged(false);
  }

  function addExtra(searchTerm: string, name: string, grams: number) {
    const placeholder: GroundedComponent = {
      aiName: name,
      grams,
      aiConfidence: "medium",
      estimationBasis: "User added manually",
      usdaFood: null,
      scaled: null,
      confirmed: false,
      kcalRange: null,
    };
    // Kick off a USDA lookup in background
    Promise.all([
      import("@/lib/nourish/usdaClient"),
      import("@/lib/nourish/mealEstimator"),
    ]).then(([{ searchUsda }, { rescaleComponent: rescale }]) =>
      searchUsda({ query: searchTerm, pageSize: 1 }).then((res) => {
        const food = res.foods[0] ?? null;
        if (food) {
          setComponents((prev) =>
            prev.map((c) =>
              c.aiName === name && c.usdaFood === null
                ? rescale({ ...c, usdaFood: food }, grams)
                : c,
            ),
          );
        }
      }),
    );
    setComponents((prev) => [...prev, placeholder]);
  }

  if (!aiEnabled) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-xs text-stone-500">
        <AlertCircle size={14} className="shrink-0 text-amber-400" />
        AI photo logging requires <code className="bg-stone-200 px-1 rounded">NEXT_PUBLIC_ANTHROPIC_API_KEY</code>.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600">
          <Camera size={13} />
          Snap or describe a meal
        </p>
        <div className="flex gap-1">
          {(["photo", "text"] as InputMode[]).map((m) => (
            <SelectablePill key={m} active={inputMode === m} onClick={() => setInputMode(m)} ariaSemantics="checked" showCheck={false} size="sm">
              {m === "photo" ? "📷 Photo" : "💬 Describe"}
            </SelectablePill>
          ))}
        </div>
      </div>

      {/* Idle / input state */}
      {state === "idle" && (
        <div className="space-y-2">
          {/* Description (always shown — improves accuracy for both modes) */}
          <textarea
            placeholder={
              inputMode === "photo"
                ? "Optional: add context — 'chicken burrito bowl, extra guac, no sour cream'"
                : "Describe your meal — 'grilled salmon with roasted broccoli and about a cup of rice'"
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
          />

          {inputMode === "photo" ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" leftIcon={<Camera size={14} />}
                onClick={() => { if (fileInputRef.current) { fileInputRef.current.capture = "environment"; fileInputRef.current.click(); } }}>
                Take photo
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Upload size={14} />}
                onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute("capture"); fileInputRef.current.click(); } }}>
                Upload
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); e.target.value = ""; }} />
            </div>
          ) : (
            <Button variant="primary" size="sm" leftIcon={<MessageSquare size={14} />}
              onClick={processText} disabled={description.trim().length < 3}>
              Estimate macros
            </Button>
          )}

          <p className="text-[10px] text-stone-400 flex items-center gap-1">
            <Info size={10} />
            Macros are estimates grounded in USDA data. Always review before logging.
          </p>
        </div>
      )}

      {/* Loading states */}
      {(state === "identifying" || state === "grounding") && (
        <div className="flex flex-col items-center gap-2 py-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Meal" className="h-24 w-auto rounded-xl object-cover" />
          )}
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Loader2 size={15} className="animate-spin text-violet-500" />
            {state === "identifying" ? "Identifying food components…" : "Looking up nutrition data…"}
          </div>
          <p className="text-[10px] text-stone-400 text-center">
            {state === "grounding" && "Grounding macros in USDA FoodData Central"}
          </p>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs text-rose-600">
            <AlertCircle size={13} /> {error}
          </p>
          <Button variant="ghost" size="sm" onClick={reset}>Try again</Button>
        </div>
      )}

      {/* Review state */}
      {state === "review" && components.length > 0 && (
        <div className="space-y-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Meal" className="h-20 w-auto rounded-xl object-cover" />
          )}

          {/* Totals header */}
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-violet-700 mb-1">Estimated total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-stone-900">{totals.kcal}</span>
              <span className="text-xs text-stone-500">kcal</span>
              <span className="text-[10px] text-stone-400">
                ({totals.kcalRange.low}–{totals.kcalRange.high} range)
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5">
              {totals.proteinG}g P · {totals.carbG}g C · {totals.fatG}g F
            </p>
          </div>

          {/* Per-item breakdown */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {components.map((c, i) => (
              <ComponentRow
                key={i}
                component={c}
                onChange={(updated) => setComponents((prev) => prev.map((x, j) => j === i ? updated : x))}
                onRemove={() => setComponents((prev) => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>

          {/* Hidden extras prompt */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExtras((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span className="text-[11px] font-semibold text-amber-800">
                ⚠️ Did you miss any oil, sauces, or drinks?
              </span>
              {showExtras ? <ChevronUp size={12} className="text-amber-600" /> : <ChevronDown size={12} className="text-amber-600" />}
            </button>
            {showExtras && (
              <div className="border-t border-amber-200 px-3 pb-3 pt-2 flex flex-wrap gap-1.5">
                {HIDDEN_EXTRAS.map((extra) => (
                  <button
                    key={extra.searchTerm}
                    type="button"
                    onClick={() => addExtra(extra.searchTerm, extra.name, extra.typicalGrams)}
                    className="flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[11px] text-amber-800 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <span>{extra.emoji}</span>
                    <Plus size={9} /> {extra.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Meal picker + log button */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Meal:</span>
            {(Object.entries(MEAL_LABELS) as [MealSlot, string][]).map(([id, label]) => (
              <SelectablePill key={id} active={meal === id} onClick={() => setMeal(id)} ariaSemantics="checked" showCheck={false} size="sm">
                {label}
              </SelectablePill>
            ))}
          </div>

          <div className="flex gap-2">
            {logged ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 motion-safe:animate-[popIn_220ms_ease-out]" />
                <span className="text-sm font-semibold text-stone-800">Logged!</span>
              </div>
            ) : (
              <>
                <Button variant="primary" size="sm" leftIcon={<Plus size={13} />}
                  onClick={handleLog} disabled={components.length === 0} className="flex-1">
                  Log to {MEAL_LABELS[meal]}
                </Button>
                <button type="button" onClick={reset}
                  className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
                  <X size={14} />
                </button>
              </>
            )}
          </div>

          <p className="text-[10px] text-stone-400">
            Estimates are grounded in USDA data but portion sizes carry ~15–25% uncertainty.
            Adjust grams above for better accuracy. Not medical advice.
          </p>
        </div>
      )}
    </div>
  );
}
