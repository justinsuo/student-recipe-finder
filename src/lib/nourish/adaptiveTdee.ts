// Adaptive TDEE service.
// Runs once per week (client-side, triggered on Nourish tab mount).
// Uses the user's actual intake + weight trend to re-estimate TDEE, then
// re-derives targets with source: "adaptive".

import {
  adaptiveTdeeEstimate,
  goalCalories,
  macroTargets,
} from "./calcEngine";
import {
  getProfile,
  getTargets,
  setTargets,
  getDiaryEntries,
  getWeightLog,
  getAdaptiveLastRun,
  setAdaptiveLastRun,
  todayString,
} from "./storage";
import type { TargetSnapshot } from "./types";

const MIN_DAYS_BETWEEN_UPDATES = 7;

export interface AdaptiveResult {
  updated: boolean;
  adaptiveTdee: number | null;
  formulaTdee: number | null;
  previousTarget: number | null;
  newTarget: number | null;
  reason: string;
}

/**
 * Checks whether an adaptive TDEE update is due and applies it if so.
 * Safe to call on every page load — is a no-op if called too soon or if
 * there isn't enough data.
 */
export function maybeUpdateAdaptiveTdee(): AdaptiveResult {
  const profile = getProfile();
  const targets = getTargets();

  if (!profile || !targets) {
    return { updated: false, adaptiveTdee: null, formulaTdee: null, previousTarget: null, newTarget: null, reason: "no-profile" };
  }

  // Throttle to once per MIN_DAYS_BETWEEN_UPDATES
  const lastRun = getAdaptiveLastRun();
  if (lastRun) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastRun + "T12:00:00").getTime()) / 86_400_000,
    );
    if (daysSince < MIN_DAYS_BETWEEN_UPDATES) {
      return { updated: false, adaptiveTdee: null, formulaTdee: null, previousTarget: targets.calorieTarget, newTarget: null, reason: `next-update-in-${MIN_DAYS_BETWEEN_UPDATES - daysSince}-days` };
    }
  }

  // Build the intake series from diary (one kcal total per date)
  const allEntries = getDiaryEntries();
  const byDate = new Map<string, number>();
  for (const e of allEntries) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.snapshotKcal * e.quantityServings);
  }
  const intakeSeries = Array.from(byDate.entries()).map(([date, kcal]) => ({ date, kcal }));

  const weightSeries = getWeightLog().map((w) => ({ date: w.date, weightKg: w.weightKg }));

  const adaptiveTdee = adaptiveTdeeEstimate(intakeSeries, weightSeries, 14);

  if (adaptiveTdee === null) {
    setAdaptiveLastRun(todayString());
    return { updated: false, adaptiveTdee: null, formulaTdee: null, previousTarget: targets.calorieTarget, newTarget: null, reason: "insufficient-data" };
  }

  // Guard against wildly implausible estimates (< 800 or > 6000 kcal)
  if (adaptiveTdee < 800 || adaptiveTdee > 6000) {
    setAdaptiveLastRun(todayString());
    return { updated: false, adaptiveTdee, formulaTdee: null, previousTarget: targets.calorieTarget, newTarget: null, reason: "implausible-estimate" };
  }

  const newCalories = goalCalories(adaptiveTdee, targets.mode, targets.weeklyRateKg);
  const newMacros = macroTargets(newCalories, profile.weightKg, targets.mode);

  const updated: TargetSnapshot = {
    effectiveFrom: todayString(),
    mode: targets.mode,
    weeklyRateKg: targets.weeklyRateKg,
    calorieTarget: newCalories,
    proteinG: newMacros.proteinG,
    carbG: newMacros.carbG,
    fatG: newMacros.fatG,
    fiberG: newMacros.fiberG,
    source: "adaptive",
  };

  setTargets(updated);
  setAdaptiveLastRun(todayString());

  return {
    updated: true,
    adaptiveTdee,
    formulaTdee: null,
    previousTarget: targets.calorieTarget,
    newTarget: newCalories,
    reason: "updated",
  };
}

/**
 * Returns the adaptive TDEE estimate using all available data (for display).
 * Does NOT update targets.
 */
export function getAdaptiveTdeeDisplay(): {
  adaptiveTdee: number | null;
  hasEnoughData: boolean;
  daysSinceLastUpdate: number | null;
} {
  const allEntries = getDiaryEntries();
  const byDate = new Map<string, number>();
  for (const e of allEntries) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.snapshotKcal * e.quantityServings);
  }
  const intakeSeries = Array.from(byDate.entries()).map(([date, kcal]) => ({ date, kcal }));
  const weightSeries = getWeightLog().map((w) => ({ date: w.date, weightKg: w.weightKg }));
  const adaptiveTdee = adaptiveTdeeEstimate(intakeSeries, weightSeries, 14);

  const lastRun = getAdaptiveLastRun();
  const daysSinceLastUpdate = lastRun
    ? Math.floor((Date.now() - new Date(lastRun + "T12:00:00").getTime()) / 86_400_000)
    : null;

  return {
    adaptiveTdee,
    hasEnoughData: adaptiveTdee !== null,
    daysSinceLastUpdate,
  };
}
