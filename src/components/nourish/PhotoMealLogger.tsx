"use client";

import { useState, useRef } from "react";
import { clsx } from "clsx";
import { Camera, Upload, Loader2, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectablePill } from "@/components/ui/SelectablePill";
import { isAiLoggingEnabled, identifyFoodFromPhoto } from "@/lib/nourish/aiMealLogger";
import { addDiaryEntry, newId, todayString } from "@/lib/nourish/storage";
import type { AiIdentifiedFood } from "@/lib/nourish/aiMealLogger";
import type { MealSlot } from "@/lib/nourish/types";

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

type State = "idle" | "loading" | "results" | "error";

interface Props {
  onLogged: () => void;
}

export function PhotoMealLogger({ onLogged }: Props) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [foods, setFoods] = useState<AiIdentifiedFood[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [meal, setMeal] = useState<MealSlot>("lunch");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiEnabled = isAiLoggingEnabled();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    // Compress/resize to keep base64 payload reasonable (<1MB)
    const canvas = document.createElement("canvas");
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    await new Promise<void>((resolve) => { img.onload = () => resolve(); });
    URL.revokeObjectURL(objectUrl);

    const MAX = 768;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];

    setPreview(dataUrl);
    setState("loading");
    setError(null);

    try {
      const results = await identifyFoodFromPhoto(base64, "image/jpeg");
      setFoods(results);
      setSelected(new Set(results.map((_, i) => i)));
      setState(results.length > 0 ? "results" : "error");
      if (results.length === 0) setError("No food identified in the image — try a clearer photo.");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "AI logging failed");
    }
  }

  function handleLog() {
    const today = todayString();
    for (const idx of selected) {
      const f = foods[idx];
      if (!f) continue;
      addDiaryEntry({
        id: newId(),
        date: today,
        meal,
        food: {
          id: `ai-photo-${newId()}`,
          source: "custom",
          name: f.name,
          servingDescription: f.servingDescription,
          kcal: f.kcal,
          proteinG: f.proteinG,
          carbG: f.carbG,
          fatG: f.fatG,
        },
        quantityServings: 1,
        snapshotKcal: f.kcal,
        snapshotProteinG: f.proteinG,
        snapshotCarbG: f.carbG,
        snapshotFatG: f.fatG,
        loggedAt: new Date().toISOString(),
      });
    }
    onLogged();
    setState("idle");
    setPreview(null);
    setFoods([]);
    setSelected(new Set());
  }

  if (!aiEnabled) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-xs text-stone-500">
        <AlertCircle size={14} className="shrink-0 text-amber-400" />
        AI photo logging requires <code className="bg-stone-200 px-1 rounded">NEXT_PUBLIC_ANTHROPIC_API_KEY</code> to be set.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm space-y-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600">
        <Camera size={13} />
        Photo log
      </p>

      {state === "idle" && (
        <div className="space-y-2">
          <p className="text-xs text-stone-500">Snap or upload a photo of your meal — AI identifies the foods and estimates macros.</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Camera size={14} />}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.capture = "environment";
                  fileInputRef.current.click();
                }
              }}
            >
              Take photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
            >
              Upload image
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {state === "loading" && (
        <div className="flex flex-col items-center gap-2 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Meal photo" className="h-28 w-auto rounded-xl object-cover" />}
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Loader2 size={16} className="animate-spin text-violet-500" />
            Identifying foods…
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs text-rose-600">
            <AlertCircle size={13} /> {error}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setState("idle")}>Try again</Button>
        </div>
      )}

      {state === "results" && foods.length > 0 && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Meal photo" className="h-24 w-auto rounded-xl object-cover" />}

          <p className="text-xs font-medium text-stone-700">Select items to log:</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {foods.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelected((s) => {
                    const next = new Set(s);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    return next;
                  });
                }}
                className={clsx(
                  "flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                  selected.has(i) ? "border-violet-400 bg-violet-50" : "border-stone-200 bg-white hover:border-violet-200",
                )}
              >
                <div className="mt-0.5">
                  {selected.has(i)
                    ? <CheckCircle2 size={14} className="text-violet-500" />
                    : <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-900">{f.name}</p>
                  <p className="text-[10px] text-stone-400">
                    {f.servingDescription} · {f.kcal} kcal · {f.proteinG}g P · {f.carbG}g C · {f.fatG}g F
                    {f.confidence === "low" && <span className="ml-1 text-amber-500"> (estimate)</span>}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Meal:</span>
            {(Object.entries(MEAL_LABELS) as [MealSlot, string][]).map(([id, label]) => (
              <SelectablePill key={id} active={meal === id} onClick={() => setMeal(id)} ariaSemantics="checked" showCheck={false} size="sm">
                {label}
              </SelectablePill>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={handleLog}
              disabled={selected.size === 0}
              className="flex-1"
            >
              Log {selected.size} item{selected.size !== 1 ? "s" : ""} to {MEAL_LABELS[meal]}
            </Button>
            <button
              type="button"
              onClick={() => { setState("idle"); setPreview(null); setFoods([]); }}
              className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
