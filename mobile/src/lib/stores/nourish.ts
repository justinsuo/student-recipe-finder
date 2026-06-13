/**
 * Nourish store — reactive bindings over the shared Nourish engine
 * (src/lib/nourish/*). Reuses the real diary/target/water logic so the phone's
 * calorie & macro math matches the website exactly.
 */
import { useCallback } from "react";
import { useKVRaw } from "../store";
import * as N from "@/lib/nourish/storage";
import { sumTotals } from "@/lib/nourish/types";
import { celebrate } from "~/components/Celebration";
import type {
  DiaryEntry,
  FoodItem,
  MealSlot,
  TargetSnapshot,
  UserProfile,
  WaterEntry,
} from "@/lib/nourish/types";

const KEYS = {
  diary: "srf:nourish-diary",
  targets: "srf:nourish-targets",
  profile: "srf:nourish-profile",
  water: "srf:nourish-water-log",
  recent: "srf:nourish-recent-foods",
  custom: "srf:nourish-custom-foods",
};

const DEFAULT_TARGET: TargetSnapshot = {
  effectiveFrom: "1970-01-01",
  mode: "maintain",
  weeklyRateKg: 0,
  calorieTarget: 2000,
  proteinG: 120,
  carbG: 230,
  fatG: 65,
  fiberG: 28,
  source: "formula",
};

export function useToday() {
  useKVRaw(KEYS.diary);
  useKVRaw(KEYS.targets);
  useKVRaw(KEYS.water);
  const today = N.todayString();
  const entries = N.getDiaryForDate(today);
  const totals = sumTotals(entries);
  const target = N.getTargets() ?? DEFAULT_TARGET;
  const water = N.getWaterForDate(today);
  const remaining = Math.max(0, target.calorieTarget - totals.kcal);
  return { today, entries, totals, target, water, remaining };
}

export function useDiary(date: string) {
  useKVRaw(KEYS.diary);
  const entries = N.getDiaryForDate(date);
  return { entries, totals: sumTotals(entries) };
}

export function useTargets(): TargetSnapshot {
  useKVRaw(KEYS.targets);
  return N.getTargets() ?? DEFAULT_TARGET;
}

export function useProfile(): UserProfile | null {
  useKVRaw(KEYS.profile);
  return N.getProfile();
}

export function useRecentFoods(): FoodItem[] {
  useKVRaw(KEYS.recent);
  return N.getRecentFoods();
}

export function logFood(food: FoodItem, meal: MealSlot, servings: number, date?: string) {
  const d = date ?? N.todayString();
  const before = sumTotals(N.getDiaryForDate(d));
  const entry: DiaryEntry = {
    id: N.newId(),
    date: d,
    meal,
    food,
    quantityServings: servings,
    snapshotKcal: food.kcal,
    snapshotProteinG: food.proteinG,
    snapshotCarbG: food.carbG,
    snapshotFatG: food.fatG,
    loggedAt: new Date().toISOString(),
  };
  N.addDiaryEntry(entry);
  N.pushRecentFood(food);

  // Celebrate the moment a daily goal is *crossed* (Duolingo-style win).
  // Only on today's log, and only on the crossing so it doesn't repeat.
  if (d === N.todayString()) {
    const after = sumTotals(N.getDiaryForDate(d));
    const t = N.getTargets() ?? DEFAULT_TARGET;
    if (t.proteinG && before.proteinG < t.proteinG && after.proteinG >= t.proteinG) {
      celebrate("Protein goal hit! 💪");
    } else if (t.calorieTarget && before.kcal < t.calorieTarget && after.kcal >= t.calorieTarget) {
      celebrate("Calorie goal hit! 🎯");
    }
  }
}

export function deleteEntry(id: string) {
  N.deleteDiaryEntry(id);
}

export function useWater(date?: string) {
  useKVRaw(KEYS.water);
  const d = date ?? N.todayString();
  const entry = N.getWaterForDate(d);
  const addMl = useCallback(
    (ml: number) => {
      const cur = N.getWaterForDate(d);
      N.setWaterForDate({ ...cur, mlConsumed: Math.max(0, cur.mlConsumed + ml) });
    },
    [d],
  );
  const setGoal = useCallback(
    (goalMl: number) => {
      const cur = N.getWaterForDate(d);
      N.setWaterForDate({ ...cur, goalMl });
    },
    [d],
  );
  return { entry, addMl, setGoal };
}

export function saveTargets(t: TargetSnapshot) {
  N.setTargets(t);
}

export { N as nourish };
export type { DiaryEntry, FoodItem, MealSlot, TargetSnapshot, UserProfile, WaterEntry };
