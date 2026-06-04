"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { ScanBarcode, Loader2, AlertCircle, CheckCircle2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectablePill } from "@/components/ui/SelectablePill";
import { lookupBarcode } from "@/lib/nourish/openFoodFacts";
import { addDiaryEntry, newId, todayString } from "@/lib/nourish/storage";
import type { FoodItem, MealSlot } from "@/lib/nourish/types";

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

type ScanState = "idle" | "scanning" | "looking-up" | "found" | "not-found" | "error" | "logged";

interface Props {
  onLogged: () => void;
}

export function BarcodeScanner({ onLogged }: Props) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [food, setFood] = useState<FoodItem | null>(null);
  const [meal, setMeal] = useState<MealSlot>("snack");
  const [servings, setServings] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animFrameRef = useRef<number>(0);

  const supportsDetector =
    typeof window !== "undefined" &&
    "BarcodeDetector" in window;

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function handleBarcode(raw: string) {
    const code = raw.trim().replace(/[^0-9]/g, "");
    if (code.length < 8) return;
    stopCamera();
    setScanState("looking-up");
    setError(null);

    const result = await lookupBarcode(code);
    if (result) {
      setFood(result);
      setScanState("found");
    } else {
      setScanState("not-found");
      setError(`No product found for barcode ${code}. Try searching by name instead.`);
    }
  }

  async function startCamera() {
    if (!supportsDetector) return;
    setScanState("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detectorRef.current = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });

      function scan() {
        if (!videoRef.current || !detectorRef.current) return;
        detectorRef.current.detect(videoRef.current)
          .then((barcodes: { rawValue: string }[]) => {
            if (barcodes.length > 0) {
              handleBarcode(barcodes[0].rawValue);
            } else {
              animFrameRef.current = requestAnimationFrame(scan);
            }
          })
          .catch(() => {
            animFrameRef.current = requestAnimationFrame(scan);
          });
      }
      animFrameRef.current = requestAnimationFrame(scan);
    } catch {
      setScanState("error");
      setError("Camera access denied. Use manual entry below.");
    }
  }

  function handleLog() {
    if (!food) return;
    addDiaryEntry({
      id: newId(),
      date: todayString(),
      meal,
      food,
      quantityServings: servings,
      snapshotKcal: food.kcal,
      snapshotProteinG: food.proteinG,
      snapshotCarbG: food.carbG,
      snapshotFatG: food.fatG,
      loggedAt: new Date().toISOString(),
    });
    setScanState("logged");
    setTimeout(() => {
      setScanState("idle");
      setFood(null);
      setServings(1);
      onLogged();
    }, 1200);
  }

  function reset() {
    stopCamera();
    setScanState("idle");
    setFood(null);
    setError(null);
    setManualBarcode("");
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm space-y-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
        <ScanBarcode size={13} />
        Barcode scanner
      </p>

      {scanState === "idle" && (
        <div className="space-y-2">
          {supportsDetector ? (
            <Button variant="outline" size="sm" leftIcon={<ScanBarcode size={14} />} onClick={startCamera}>
              Scan barcode
            </Button>
          ) : (
            <p className="text-xs text-stone-500">Live scanning requires Chrome or Edge. Use manual entry:</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter barcode manually…"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleBarcode(manualBarcode); }}
              className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <Button variant="outline" size="sm" onClick={() => handleBarcode(manualBarcode)} disabled={manualBarcode.length < 6}>
              Look up
            </Button>
          </div>
        </div>
      )}

      {scanState === "scanning" && (
        <div className="relative space-y-2">
          <video
            ref={videoRef}
            className="w-full rounded-xl object-cover"
            style={{ maxHeight: 200 }}
            playsInline
            muted
          />
          {/* Scan guide overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-48 rounded-lg border-2 border-amber-400 opacity-70" />
          </div>
          <p className="text-center text-xs text-stone-500">Point camera at barcode…</p>
          <Button variant="ghost" size="sm" onClick={reset} className="w-full">Cancel</Button>
        </div>
      )}

      {scanState === "looking-up" && (
        <div className="flex items-center gap-2 py-2 text-sm text-stone-600">
          <Loader2 size={15} className="animate-spin text-amber-500" />
          Looking up product…
        </div>
      )}

      {(scanState === "not-found" || scanState === "error") && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs text-rose-600">
            <AlertCircle size={13} /> {error}
          </p>
          <Button variant="ghost" size="sm" onClick={reset}>Try again</Button>
        </div>
      )}

      {scanState === "found" && food && (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5">
            <p className="text-sm font-bold text-stone-900">{food.name}</p>
            {food.brand && <p className="text-[11px] text-stone-400">{food.brand}</p>}
            <p className="text-xs text-stone-500 mt-0.5">
              {food.servingDescription} · {food.kcal} kcal · {food.proteinG}g P · {food.carbG}g C · {food.fatG}g F
            </p>
          </div>

          {/* Servings */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-stone-600 w-16">Servings</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setServings((s) => Math.max(0.5, parseFloat((s - 0.5).toFixed(1))))}
                className="grid h-7 w-7 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">−</button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{servings}</span>
              <button type="button" onClick={() => setServings((s) => parseFloat((s + 0.5).toFixed(1)))}
                className="grid h-7 w-7 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">+</button>
            </div>
            <span className="text-xs text-stone-400">= {Math.round(food.kcal * servings)} kcal</span>
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
            <Button variant="primary" size="sm" leftIcon={<Plus size={13} />} onClick={handleLog} className="flex-1">
              Add to {MEAL_LABELS[meal]}
            </Button>
            <button type="button" onClick={reset}
              className={clsx("grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400")}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {scanState === "logged" && (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle2 size={18} className="text-emerald-500 motion-safe:animate-[popIn_220ms_ease-out]" />
          <p className="text-sm font-semibold text-stone-800">Logged to {MEAL_LABELS[meal]}!</p>
        </div>
      )}
    </div>
  );
}
