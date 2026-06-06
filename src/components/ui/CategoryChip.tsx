"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Pantry Pop CategoryChip — a strong-color tag pill that maps recipe
 * tag strings (or arbitrary keys) to a consistent color. Used on
 * recipe cards, filter rows, and feature surfaces so the same category
 * reads the same way everywhere.
 *
 * Falls back to a soft Pantry-Pop biscuit tone if the key isn't in
 * the map.
 */
const MAP: Record<string, string> = {
  // Product surfaces
  "ai-chef":         "bg-[#EFE8FF] text-[#3F2BB8] ring-[#CDBEFF]",
  "pantry":          "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "cheap":           "bg-[#FFF3CC] text-[#7A4A00] ring-[#FFE08A]",
  "nourish":         "bg-[#FFE8D6] text-[#9B3F0A] ring-[#FFC79A]",
  "grocery":         "bg-[#DCFAF1] text-[#0B6E55] ring-[#A4ECD8]",
  "saved":           "bg-[#FFE3EC] text-[#A23163] ring-[#F9B6CD]",

  // Ingredient categories (matches IngredientCategory union in lib/types)
  "grain":           "bg-[#FFF3CC] text-[#7A4A00] ring-[#FFE08A]",
  "protein":         "bg-[#EFE8FF] text-[#3F2BB8] ring-[#CDBEFF]",
  "vegetable":       "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "fruit":           "bg-[#FFE3EC] text-[#A23163] ring-[#F9B6CD]",
  "dairy":           "bg-[#E0F2FE] text-[#1F6FA8] ring-[#BAE6FD]",
  "canned":          "bg-[#FFE8D6] text-[#9B3F0A] ring-[#FFC79A]",
  "condiment":       "bg-[#DCFAF1] text-[#0B6E55] ring-[#A4ECD8]",
  "spice":           "bg-[#FDE4E4] text-[#9B1C1C] ring-[#F8B4B4]",
  "frozen":          "bg-[#E0F2FE] text-[#1F6FA8] ring-[#BAE6FD]",

  // Equipment
  "microwave":       "bg-[#E0F2FE] text-[#1F6FA8] ring-[#BAE6FD]",
  "air-fryer":       "bg-[#FFE8D6] text-[#9B3F0A] ring-[#FFC79A]",
  "stovetop":        "bg-[#FFE08A] text-[#5C3700] ring-[#FFC93D]",
  "oven":            "bg-[#FFE8D6] text-[#9B3F0A] ring-[#FFC79A]",
  "rice-cooker":     "bg-[#DCFAF1] text-[#0B6E55] ring-[#A4ECD8]",
  "no-kitchen":      "bg-[#FFF1D9] text-[#3A2A12] ring-[#E8D8C4]",
  "no-stove":        "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "one-pot":         "bg-[#FFF3CC] text-[#7A4A00] ring-[#FFE08A]",

  // Diet
  "high-protein":    "bg-[#EFE8FF] text-[#3F2BB8] ring-[#CDBEFF]",
  "vegetarian":      "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "vegan":           "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "gluten-free":     "bg-[#FFF3CC] text-[#7A4A00] ring-[#FFE08A]",
  "dairy-free":      "bg-[#E0F2FE] text-[#1F6FA8] ring-[#BAE6FD]",

  // Inventory / heat
  "use-soon":        "bg-[#FFF3CC] text-[#5C3700] ring-[#FFE08A]",
  "spicy":           "bg-[#FDE4E4] text-[#9B1C1C] ring-[#F8B4B4]",
  "staple":          "bg-[#FFF1D9] text-[#3A2A12] ring-[#E8D8C4]",
  "cheap-tag":       "bg-[#FFF3CC] text-[#7A4A00] ring-[#FFE08A]",

  // Meal context
  "meal-prep":       "bg-[#DCFAF1] text-[#0B6E55] ring-[#A4ECD8]",
  "dorm-friendly":   "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "breakfast":       "bg-[#FFE08A] text-[#5C3700] ring-[#FFC93D]",
  "lunch":           "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "dinner":          "bg-[#E0F2FE] text-[#1F6FA8] ring-[#BAE6FD]",
  "snack":           "bg-[#FFE3EC] text-[#A23163] ring-[#F9B6CD]",

  // Difficulty
  "easy":            "bg-[#E8FAF0] text-[#16834A] ring-[#B6E8CD]",
  "medium":          "bg-[#FFF3CC] text-[#7A4A00] ring-[#FFE08A]",
  "hard":            "bg-[#FDE4E4] text-[#9B1C1C] ring-[#F8B4B4]",
};

const FALLBACK = "bg-[#FFF1D9] text-[#3A2A12] ring-[#E8D8C4]";

function normalizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

function humanLabel(raw: string): string {
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CategoryChip({
  children,
  category,
  size = "sm",
  className,
}: {
  /** Display label; if omitted, derived from `category`. */
  children?: ReactNode;
  /** Key used to choose the color (also the source for the auto label). */
  category: string;
  size?: "xs" | "sm";
  className?: string;
}) {
  const key = normalizeKey(category);
  const palette = MAP[key] ?? FALLBACK;
  const label = children ?? humanLabel(category);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
        size === "xs"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-0.5 text-[11px]",
        palette,
        className,
      )}
    >
      {label}
    </span>
  );
}
