"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clock,
  Coins,
  Flame,
  Sparkles,
  ChefHat,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getCustomRecipe,
  getStoredRecipeImage,
  imageDataUrl,
} from "@/lib/customRecipeStorage";
import { useAppStore } from "@/lib/AppStore";
import type { CustomRecipe } from "@/lib/customRecipeTypes";

export default function CustomRecipePageWrapper() {
  return (
    <Suspense fallback={<div className="text-stone-500">Loading…</div>}>
      <CustomRecipePage />
    </Suspense>
  );
}

function CustomRecipePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { isSaved, toggleSaved } = useAppStore();
  const [recipe, setRecipe] = useState<CustomRecipe | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecipe(null);
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
      setImageSrc(src ?? null);
    }
  }, [id]);

  if (!id || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-white px-6 py-20 text-center">
        <div className="mb-3 text-6xl" aria-hidden>
          🍳
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Recipe not found</h1>
        <p className="mt-2 max-w-md text-sm text-stone-600">
          This generated/custom recipe lives only in this browser&apos;s
          storage. It may have been cleared.
        </p>
        <Link
          href="/saved"
          className="mt-5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Back to saved
        </Link>
      </div>
    );
  }

  const saved = isSaved(id);

  return (
    <div className="space-y-8">
      <Link
        href="/saved"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-emerald-700"
      >
        <ArrowLeft size={14} /> Back to saved
      </Link>

      <div className="overflow-hidden rounded-3xl shadow-sm">
        <div className="relative aspect-[16/9] bg-stone-100">
          {imageSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageSrc}
              alt={recipe.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-50 text-stone-500">
              <ChefHat size={48} />
              <p className="mt-2 text-xs uppercase tracking-wide">
                No image yet
              </p>
            </div>
          )}
          <div className="absolute right-3 top-3">
            {recipe.isAIGenerated ? (
              <Badge tone="violet">
                <Sparkles size={11} className="mr-1" /> AI Generated
              </Badge>
            ) : (
              <Badge tone="emerald">Created by you</Badge>
            )}
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
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
          {recipe.name}
        </h1>
        <p className="text-stone-700">{recipe.description}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => toggleSaved(id)}
            leftIcon={
              saved ? (
                <BookmarkCheck size={16} className="text-emerald-600" />
              ) : (
                <Bookmark size={16} />
              )
            }
          >
            {saved ? "Saved" : "Save recipe"}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            Ingredients
          </h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-800">
                    {ing.name}{" "}
                    {ing.optional && (
                      <span className="text-xs text-stone-500">(optional)</span>
                    )}
                  </p>
                  <p className="text-xs text-stone-500">
                    {ing.quantity} {ing.unit}
                  </p>
                </div>
                <p className="font-medium text-stone-900">
                  ${ing.estimatedCost.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            Steps
          </h2>
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

      {(recipe.cheapTips?.length ?? 0) > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            Why it&apos;s cheap
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-stone-700">
            {recipe.cheapTips!.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </Card>
      )}

      {recipe.storageInstructions && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            Storage &amp; reheating
          </h2>
          <p className="mt-2 text-sm text-stone-700">
            {recipe.storageInstructions}
          </p>
          {recipe.reheatingInstructions && (
            <p className="mt-1 text-sm text-stone-700">
              {recipe.reheatingInstructions}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
