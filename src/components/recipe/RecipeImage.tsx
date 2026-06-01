"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { getRecipeImage } from "@/data/recipeImages";
import type { Recipe } from "@/lib/types";

interface Props {
  recipe: Recipe;
  variant?: "card" | "hero";
  className?: string;
  /**
   * Children render *above* the image (overlay badges).
   */
  overlay?: React.ReactNode;
  /**
   * If true, show attribution text below the image (hero mode only).
   */
  showAttribution?: boolean;
}

/**
 * Visual hero/thumbnail for a recipe. Tries the curated real photo from
 * RECIPE_IMAGES first; if there is no photo (or it fails to load), falls back
 * to a polished gradient + emoji placeholder.
 */
export function RecipeImage({
  recipe,
  variant = "card",
  className,
  overlay,
  showAttribution = false,
}: Props) {
  const img = getRecipeImage(recipe.id);
  const [errored, setErrored] = useState(false);
  const useFallback = !img || errored;

  const aspect = variant === "hero" ? "aspect-[16/9]" : "aspect-[4/3]";
  const radius =
    variant === "hero" ? "rounded-3xl" : "rounded-t-2xl";

  return (
    <figure className={clsx("relative w-full", className)}>
      <div
        className={clsx(
          "relative overflow-hidden bg-stone-100",
          aspect,
          radius,
        )}
      >
        {useFallback ? (
          <Fallback recipe={recipe} variant={variant} />
        ) : (
          // External Wikimedia images on a statically-exported site — plain
          // <img> is the simplest path. Lazy-loaded + async-decoded.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img!.src}
            alt={img!.alt || recipe.name}
            loading="lazy"
            decoding="async"
            onError={() => setErrored(true)}
            className={clsx(
              "h-full w-full object-cover transition-transform duration-300",
              variant === "card" && "group-hover:scale-105",
            )}
          />
        )}

        {/* Subtle bottom gradient for readability of badges */}
        {!useFallback && (
          <div
            aria-hidden
            className={clsx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent",
              variant === "card" ? "h-12" : "h-20",
            )}
          />
        )}

        {overlay && (
          <div className="absolute inset-0 flex items-end justify-between p-3">
            {overlay}
          </div>
        )}
      </div>

      {showAttribution && img && img.attributionText && (
        <figcaption className="mt-2 text-[11px] text-stone-500">
          {img.attributionText}.{" "}
          <a
            href={img.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-stone-700"
          >
            Source
          </a>
        </figcaption>
      )}
    </figure>
  );
}

function Fallback({
  recipe,
  variant,
}: {
  recipe: Recipe;
  variant: "card" | "hero";
}) {
  // Build a gradient that matches the recipe's accent color
  const accentGradient = recipe.accentColor.replace("bg-", "from-");
  return (
    <div
      className={clsx(
        "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br to-white",
        accentGradient,
      )}
    >
      <span
        className={variant === "hero" ? "text-[8rem]" : "text-7xl"}
        aria-hidden
      >
        {recipe.emoji}
      </span>
      {variant === "hero" && (
        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-stone-500">
          Photo coming soon
        </p>
      )}
    </div>
  );
}
