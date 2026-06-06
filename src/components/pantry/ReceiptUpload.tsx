"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Receipt,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/AppStore";
import {
  isAiEnabled,
  recognizeIngredientsFromReceipt,
  type VisionResult,
} from "@/lib/anthropic";
import { INGREDIENT_MAP } from "@/data/ingredients";

const MAX_DIMENSION = 1600; // receipts are tall + benefit from sharper text

async function fileToBase64Resized(
  file: File,
): Promise<{ base64: string; mediaType: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new window.Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not load image"));
      i.src = objectUrl;
    });
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.9,
      );
    });
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { base64: btoa(binary), mediaType: "image/jpeg" };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Snap or upload a grocery receipt. We OCR it via the same Anthropic vision
 * helper used for fridge photos (different system prompt), then surface the
 * matched ingredients for one-tap add to the pantry. Non-food lines (totals,
 * tax, bag fees, store name) are filtered out by the prompt.
 *
 * `variant="compact"` is used inside AI Chef's pantry block, where the
 * larger amber-card framing would compete with the existing visuals.
 */
export function ReceiptUpload({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const { addPantryItem, pantry } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Free any outstanding blob URL when the component unmounts so we
  // don't leak the receipt image (often multi-MB).
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  if (!isAiEnabled()) return null;

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setAddedIds(new Set());
    // Revoke the previous preview before creating a new one — otherwise
    // re-uploads pile blob references in memory.
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
    setLoading(true);
    try {
      const { base64, mediaType } = await fileToBase64Resized(file);
      const res = await recognizeIngredientsFromReceipt(base64, mediaType);
      const validRecognized = res.recognized.filter((r) =>
        INGREDIENT_MAP.has(r.id),
      );
      const filtered: VisionResult = {
        ...res,
        recognized: validRecognized,
        unrecognized: [
          ...res.unrecognized,
          ...res.recognized
            .filter((r) => !INGREDIENT_MAP.has(r.id))
            .map((r) => r.name),
        ],
      };
      setResult(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function addAll() {
    if (!result) return;
    const newly = new Set(addedIds);
    for (const r of result.recognized) {
      if (!pantry.some((p) => p.ingredientId === r.id)) {
        addPantryItem({ ingredientId: r.id });
      }
      newly.add(r.id);
    }
    setAddedIds(newly);
  }

  function reset() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setAddedIds(new Set());
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  const shellCls =
    variant === "compact"
      ? "rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
      : "rounded-3xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6";

  return (
    <section className={shellCls}>
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-800">
          <Receipt size={16} /> Scan a grocery receipt
        </h2>
        <p className="mt-1 text-sm text-amber-900">
          Snap or upload a photo of your latest receipt. We&apos;ll pull out
          the food line items and add them to your pantry. Totals, tax, bag
          fees, and store info are ignored.
        </p>
      </div>

      {!previewUrl && (
        <div
          className={
            variant === "compact"
              ? "mt-3 grid gap-2 sm:grid-cols-2"
              : "mt-4 grid gap-3 sm:grid-cols-2"
          }
        >
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-3.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <Camera size={18} /> Take photo
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-3.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <ImageIcon size={18} /> Upload image
          </button>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {previewUrl && (
        <div className="mt-4 space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded grocery receipt"
              className="mx-auto max-h-80 w-full object-contain"
            />
            <button
              onClick={reset}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-amber-800">
              <Loader2 size={16} className="animate-spin" /> Transcribing the
              receipt and matching items to your pantry…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 flex-none" />
              <div>
                <p className="font-medium">Couldn&apos;t read the receipt</p>
                <p className="mt-0.5 text-xs">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-stone-900">
                    Items found ({result.recognized.length})
                  </h3>
                  {result.recognized.length > 0 && (
                    <Button
                      size="sm"
                      onClick={addAll}
                      leftIcon={<Plus size={14} />}
                    >
                      Add all to pantry
                    </Button>
                  )}
                </div>
                {result.recognized.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-600">
                    We didn&apos;t find any catalog items on this receipt. Try
                    a sharper photo, or add items manually.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.recognized.map((r) => {
                      const ing = INGREDIENT_MAP.get(r.id);
                      const already =
                        addedIds.has(r.id) ||
                        pantry.some((p) => p.ingredientId === r.id);
                      return (
                        <button
                          key={r.id}
                          disabled={already}
                          onClick={() => {
                            addPantryItem({ ingredientId: r.id });
                            setAddedIds(new Set([...addedIds, r.id]));
                          }}
                          className={
                            already
                              ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700"
                              : "inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                          }
                        >
                          {already ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Plus size={12} />
                          )}
                          {ing?.name ?? r.name}
                          <span className="ml-0.5 text-stone-400">
                            {(r.confidence * 100).toFixed(0)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {result.unrecognized.length > 0 && (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-amber-100">
                  <h3 className="text-sm font-semibold text-amber-900">
                    Not in our catalog ({result.unrecognized.length})
                  </h3>
                  <p className="mt-1 text-xs text-amber-800">
                    We read these from the receipt but they aren&apos;t in the
                    catalog yet. Add any of these as a custom ingredient on
                    the pantry page if you want them tracked.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.unrecognized.map((u, i) => (
                      <span
                        key={`${u}-${i}`}
                        className="rounded-full bg-stone-50 px-3 py-1.5 text-xs text-stone-700"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
