// Pure, side-effect-free calculation engine for Nourish.
// All inputs in canonical SI units (kg, cm). No I/O, no state.
// Each exported function can be verified independently.

import { dateToLocalString } from "./storage";
import type {
  Sex,
  ActivityLevel,
  GoalMode,
  TargetSource,
  TargetSnapshot,
  UserProfile,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;

// 1 kg of body fat ≈ 7,700 kcal
export const KCAL_PER_KG_FAT = 7700;

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// ─── BMR ─────────────────────────────────────────────────────────────────────

/**
 * Mifflin-St Jeor equation (default when sex is known).
 * Returns kcal/day.
 */
export function bmrMifflin(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/**
 * Katch-McArdle equation (better when body-fat % is known).
 * Returns kcal/day.
 */
export function bmrKatchMcArdle(
  weightKg: number,
  bodyFatFraction: number,
): number {
  const lbmKg = weightKg * (1 - bodyFatFraction);
  return 370 + 21.6 * lbmKg;
}

/**
 * Selects the best available BMR formula based on available profile data.
 */
export function bestBmr(profile: UserProfile): number {
  if (
    profile.bodyFatFraction !== undefined &&
    profile.bodyFatFraction > 0 &&
    profile.bodyFatFraction < 1
  ) {
    return bmrKatchMcArdle(profile.weightKg, profile.bodyFatFraction);
  }
  if (profile.sex) {
    return bmrMifflin(
      profile.weightKg,
      profile.heightCm,
      profile.age,
      profile.sex,
    );
  }
  // Fallback: average of male and female Mifflin-St Jeor
  return (
    (bmrMifflin(profile.weightKg, profile.heightCm, profile.age, "male") +
      bmrMifflin(profile.weightKg, profile.heightCm, profile.age, "female")) /
    2
  );
}

// ─── TDEE ─────────────────────────────────────────────────────────────────────

export function tdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

// ─── Goal calories ────────────────────────────────────────────────────────────

/**
 * Derives the daily calorie target from TDEE + goal + desired weekly rate.
 *
 * weeklyRateKg: positive = gain, negative = loss.
 * Returns kcal/day.
 */
export function goalCalories(
  tdeeKcal: number,
  mode: GoalMode,
  weeklyRateKg: number,
): number {
  if (mode === "maintain" || mode === "recomp") return Math.round(tdeeKcal);
  const dailyDelta = (weeklyRateKg * KCAL_PER_KG_FAT) / 7;
  return Math.round(tdeeKcal + dailyDelta);
}

/**
 * Returns the maximum advisable weekly rate of change as a fraction of
 * bodyweight (positive = gain cap, negative = loss cap).
 * 1% bw/week cut cap; 0.5% bw/week bulk cap (lean bulk).
 */
export function maxWeeklyRateKg(
  weightKg: number,
  mode: GoalMode,
): { min: number; max: number } {
  if (mode === "cut") return { min: -(weightKg * 0.01), max: 0 };
  if (mode === "bulk") return { min: 0, max: weightKg * 0.005 };
  return { min: 0, max: 0 };
}

// ─── Macro targets ────────────────────────────────────────────────────────────

export interface MacroTargets {
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

/**
 * Derives macro gram targets from calorie goal and body stats.
 *
 * Strategy:
 *  1. Protein anchored to 2.0 g/kg (biased high; 2.3 g/kg on a cut).
 *  2. Fat floored at 0.8 g/kg (hormonal health).
 *  3. Carbs fill remaining calories.
 *  4. Fiber target: 14 g per 1,000 kcal.
 */
export function macroTargets(
  calorieTarget: number,
  weightKg: number,
  mode: GoalMode,
): MacroTargets {
  // 1. Protein
  const proteinPerKg = mode === "cut" ? 2.3 : 2.0;
  const proteinG = Math.round(weightKg * proteinPerKg);

  // 2. Fat floor
  const fatG = Math.round(Math.max(weightKg * 0.8, calorieTarget * 0.25 / KCAL_PER_G_FAT));

  // 3. Carbs from remainder
  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = fatG * KCAL_PER_G_FAT;
  const carbKcal = Math.max(0, calorieTarget - proteinKcal - fatKcal);
  const carbG = Math.round(carbKcal / KCAL_PER_G_CARB);

  // 4. Fiber
  const fiberG = Math.round((calorieTarget / 1000) * 14);

  return { proteinG, carbG, fatG, fiberG };
}

/**
 * Verifies that macro grams reconcile back to the calorie target within ±10
 * kcal rounding tolerance. Returns the computed total for debugging.
 */
export function reconcileMacros(
  targets: MacroTargets,
  calorieTarget: number,
): { ok: boolean; computed: number; delta: number } {
  const computed =
    targets.proteinG * KCAL_PER_G_PROTEIN +
    targets.carbG * KCAL_PER_G_CARB +
    targets.fatG * KCAL_PER_G_FAT;
  const delta = Math.abs(computed - calorieTarget);
  return { ok: delta <= 10, computed, delta };
}

// ─── Full target derivation ───────────────────────────────────────────────────

/**
 * Derives a complete TargetSnapshot from a UserProfile + goal parameters.
 * This is the single entry point used by onboarding, profile edits, and
 * adaptive re-derivation.
 */
export function deriveTargets(
  profile: UserProfile,
  mode: GoalMode,
  weeklyRateKg: number,
  source: TargetSource = "formula",
  effectiveFrom: string = dateToLocalString(new Date()),
): TargetSnapshot {
  const bmr = bestBmr(profile);
  const tdeeKcal = tdee(bmr, profile.activityLevel);
  const calorieTarget = goalCalories(tdeeKcal, mode, weeklyRateKg);
  const macros = macroTargets(calorieTarget, profile.weightKg, mode);

  return {
    effectiveFrom,
    mode,
    weeklyRateKg,
    calorieTarget,
    proteinG: macros.proteinG,
    carbG: macros.carbG,
    fatG: macros.fatG,
    fiberG: macros.fiberG,
    source,
  };
}

// ─── Adaptive TDEE (Phase 2 seed) ─────────────────────────────────────────────

/**
 * Exponentially-weighted moving average weight trend.
 * alpha ∈ (0, 1]: higher alpha = more responsive, lower = smoother.
 * Typical value: 0.1 (10-day memory).
 */
export function ewmaWeight(
  weights: { date: string; weightKg: number }[],
  alpha = 0.1,
): number | null {
  if (weights.length === 0) return null;
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  let ema = sorted[0].weightKg;
  for (let i = 1; i < sorted.length; i++) {
    ema = alpha * sorted[i].weightKg + (1 - alpha) * ema;
  }
  return ema;
}

/**
 * Estimates the user's real TDEE from intake + weight trend over a rolling
 * window.
 *
 * Approach: energy_balance = (intake_avg − tdee_est) × days
 * We observe the actual weight change and back-calculate TDEE.
 *
 * Returns null when there is insufficient data (< 2 data points in window).
 */
export function adaptiveTdeeEstimate(
  entries: { date: string; kcal: number }[],
  weights: { date: string; weightKg: number }[],
  windowDays = 14,
): number | null {
  if (entries.length < 3 || weights.length < 2) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffStr = dateToLocalString(cutoff);

  const recentEntries = entries.filter((e) => e.date >= cutoffStr);
  const recentWeights = weights.filter((w) => w.date >= cutoffStr);

  if (recentEntries.length < 3 || recentWeights.length < 2) return null;

  const avgIntake =
    recentEntries.reduce((s, e) => s + e.kcal, 0) / recentEntries.length;

  const sortedW = [...recentWeights].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const weightChangePeriod =
    sortedW[sortedW.length - 1].weightKg - sortedW[0].weightKg;
  const days = recentEntries.length;

  // kcal equivalent of weight change
  const netKcal = weightChangePeriod * KCAL_PER_KG_FAT;

  // tdee = avgIntake - netKcal/days
  const estimatedTdee = avgIntake - netKcal / days;
  return Math.round(estimatedTdee);
}

// ─── Unit conversion helpers ──────────────────────────────────────────────────

export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/** Converts total inches to { feet, inches }. */
export function inchesToFeetAndInches(totalInches: number): {
  feet: number;
  inches: number;
} {
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetAndInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}
