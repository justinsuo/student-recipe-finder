"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Coins, Clock, Flame } from "lucide-react";
import { calculateCostPerServing } from "@/lib/recipeScoring";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { RECIPE_MAP } from "@/data/recipes";

/**
 * Hero-only visual: a row of three pantry ingredient chips → a soft
 * arrow → a real recipe card from the seed data. Numbers (cost, time,
 * macros) are live from RECIPE_MAP so the preview doesn't lie.
 *
 * Stays compact (no h1/h2) — it sits between the hero copy and the
 * stat strip so the user gets a "this is the actual product" hit
 * without scrolling.
 */
const CHIPS = [
  { label: "Rice",      tone: "bg-[#FFD166] text-[#5C3700] border-[#FFC93D]" },
  { label: "Eggs",      tone: "bg-[#FFE8D6] text-[#7C3309] border-[#FFC79A]" },
  { label: "Soy sauce", tone: "bg-[#E8FAF0] text-[#0F5E33] border-[#B6E8CD]" },
];

const TARGET_RECIPE_ID = "egg-fried-rice";

export function PantryToRecipePreview() {
  const recipe = RECIPE_MAP.get(TARGET_RECIPE_ID);
  if (!recipe) return null;
  const cps = calculateCostPerServing(recipe);
  const macros = bestEffortNutrition(recipe).estimate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="relative mt-4 max-w-xl"
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#E8D8C4] bg-white/85 p-4 shadow-[0_8px_24px_-12px_rgba(36,26,18,0.18)] backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:p-5">
        {/* Eyebrow */}
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9B3F0A]">
          How it works
        </p>

        {/* Row: chips → arrow → card */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
          {/* Pantry chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CHIPS.map((c, i) => (
              <motion.span
                key={c.label}
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.35 + i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${c.tone}`}
              >
                {c.label}
              </motion.span>
            ))}
          </div>

          {/* Arrow */}
          <motion.span
            aria-hidden
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.85 }}
            className="grid h-7 w-7 flex-none place-items-center rounded-full bg-gradient-to-b from-[#3AD081] to-[#2FBF71] text-white shadow-sm shadow-[#16834A]/30"
          >
            <ArrowRight size={14} strokeWidth={2.6} />
          </motion.span>

          {/* Recipe target card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 flex-1"
          >
            <Link
              href={`/recipes/${recipe.id}?from=home`}
              className="group flex items-center gap-3 rounded-2xl border border-[#B6E8CD] bg-gradient-to-br from-[#E8FAF0] to-white px-3 py-2 transition-all motion-safe:hover:-translate-y-px hover:border-[#2FBF71] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2FBF71]"
            >
              <span aria-hidden className="text-2xl">{recipe.emoji ?? "🍚"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-[#0F5E33]">
                  {recipe.name}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#16834A]">
                  <span className="inline-flex items-center gap-1">
                    <Coins size={11} /> ${cps.toFixed(2)}/serving
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#9B3F0A]">
                    <Flame size={11} /> {macros.protein}g protein
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#1F6FA8]">
                    <Clock size={11} /> {recipe.totalTimeMinutes} min
                  </span>
                </span>
              </span>
              <ArrowRight
                size={14}
                className="flex-none text-[#16834A] transition-transform motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
