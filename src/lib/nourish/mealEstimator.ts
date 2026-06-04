// USDA-grounded meal estimation.
// Takes AI component names + gram estimates, looks each up in USDA,
// and returns per-component macros scaled to the estimated grams.
// This is the accuracy layer: the model handles "what" and "how much",
// the database handles "macros".

import { searchUsda } from "./usdaClient";
import type { FoodItem } from "./types";
import type { AiMealComponent } from "./aiMealLogger";

// ─── Grounded component ───────────────────────────────────────────────────────

export interface GroundedComponent {
  /** What the AI called it */
  aiName: string;
  /** AI's gram estimate (user can adjust) */
  grams: number;
  /** AI confidence for identification */
  aiConfidence: "high" | "medium" | "low";
  estimationBasis: string;
  /** Best USDA match (null if no match found) */
  usdaFood: FoodItem | null;
  /** Macros scaled to `grams` from USDA entry. null if no match. */
  scaled: { kcal: number; proteinG: number; carbG: number; fatG: number } | null;
  /** Whether user has confirmed/adjusted this item */
  confirmed: boolean;
  /** Rough calorie range (±20% for portion uncertainty) */
  kcalRange: { low: number; high: number } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scaleFromUsda(
  food: FoodItem,
  grams: number,
): { kcal: number; proteinG: number; carbG: number; fatG: number } {
  // FoodItem stores per-serving macros; servingGrams is grams per serving.
  // If servingGrams is missing, assume values are already per 100g.
  const baseGrams = food.servingGrams ?? 100;
  const scale = grams / baseGrams;
  return {
    kcal: Math.round(food.kcal * scale),
    proteinG: parseFloat((food.proteinG * scale).toFixed(1)),
    carbG: parseFloat((food.carbG * scale).toFixed(1)),
    fatG: parseFloat((food.fatG * scale).toFixed(1)),
  };
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

/**
 * Takes AI-identified components and resolves USDA macros for each.
 * Runs USDA searches in parallel. Components with no USDA match are still
 * included so the user can manually handle them.
 */
export async function groundComponentsInUsda(
  components: AiMealComponent[],
): Promise<GroundedComponent[]> {
  const results = await Promise.all(
    components.map(async (c): Promise<GroundedComponent> => {
      let usdaFood: FoodItem | null = null;
      try {
        const res = await searchUsda({ query: c.name, pageSize: 1 });
        usdaFood = res.foods[0] ?? null;
      } catch {
        // Non-fatal — user can still adjust manually
      }

      const scaled = usdaFood ? scaleFromUsda(usdaFood, c.estimatedGrams) : null;
      const kcalRange =
        scaled
          ? { low: Math.round(scaled.kcal * 0.8), high: Math.round(scaled.kcal * 1.2) }
          : null;

      return {
        aiName: c.name,
        grams: c.estimatedGrams,
        aiConfidence: c.confidence,
        estimationBasis: c.estimationBasis,
        usdaFood,
        scaled,
        confirmed: false,
        kcalRange,
      };
    }),
  );

  return results;
}

/** Re-scales a component when the user adjusts the gram amount. */
export function rescaleComponent(
  component: GroundedComponent,
  newGrams: number,
): GroundedComponent {
  const scaled = component.usdaFood
    ? scaleFromUsda(component.usdaFood, newGrams)
    : null;
  const kcalRange =
    scaled
      ? { low: Math.round(scaled.kcal * 0.8), high: Math.round(scaled.kcal * 1.2) }
      : null;
  return { ...component, grams: newGrams, scaled, kcalRange };
}

/** Sums macros across all grounded components. */
export function sumGroundedMacros(components: GroundedComponent[]): {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  kcalRange: { low: number; high: number };
} {
  let kcal = 0, proteinG = 0, carbG = 0, fatG = 0;
  let kcalLow = 0, kcalHigh = 0;
  for (const c of components) {
    if (c.scaled) {
      kcal += c.scaled.kcal;
      proteinG += c.scaled.proteinG;
      carbG += c.scaled.carbG;
      fatG += c.scaled.fatG;
    }
    if (c.kcalRange) {
      kcalLow += c.kcalRange.low;
      kcalHigh += c.kcalRange.high;
    }
  }
  return {
    kcal: Math.round(kcal),
    proteinG: parseFloat(proteinG.toFixed(1)),
    carbG: parseFloat(carbG.toFixed(1)),
    fatG: parseFloat(fatG.toFixed(1)),
    kcalRange: { low: kcalLow, high: kcalHigh },
  };
}
