// All Nourish feature types. Stored canonically in metric (kg, cm).
// UI layer converts to/from imperial based on UserProfile.preferredUnits.

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very_active"
  | "extra_active";
export type GoalMode = "cut" | "maintain" | "bulk" | "recomp";
export type TargetSource = "formula" | "adaptive" | "manual";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "usda" | "custom" | "recipe";
export type PreferredUnits = "metric" | "imperial";

// ─── Profile ────────────────────────────────────────────────────────────────

export interface UserProfile {
  /** Height in centimetres (canonical). */
  heightCm: number;
  /** Current weight in kilograms (canonical). */
  weightKg: number;
  /** Age in whole years. */
  age: number;
  /** Optional; used for Mifflin-St Jeor. Omit for body-comp flow. */
  sex?: Sex;
  /** Body-fat fraction 0–1 (optional; unlocks Katch-McArdle). */
  bodyFatFraction?: number;
  activityLevel: ActivityLevel;
  preferredUnits: PreferredUnits;
}

// ─── Targets ────────────────────────────────────────────────────────────────

export interface TargetSnapshot {
  /** ISO-8601 date this snapshot became effective (YYYY-MM-DD). */
  effectiveFrom: string;
  mode: GoalMode;
  /** Desired change in kg per week (positive = gain, negative = loss). */
  weeklyRateKg: number;
  calorieTarget: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  source: TargetSource;
}

// ─── Weight log ─────────────────────────────────────────────────────────────

export interface WeightEntry {
  id: string;
  /** ISO-8601 date (YYYY-MM-DD). */
  date: string;
  /** Weight in kilograms (canonical). */
  weightKg: number;
}

// ─── Food database ──────────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  source: FoodSource;
  /** USDA fdcId or recipe id when source is not "custom". */
  externalId?: string;
  name: string;
  brand?: string;
  /** Human-readable e.g. "1 medium apple" or "100g". */
  servingDescription: string;
  /** Grams per serving (used for scaling). */
  servingGrams?: number;
  /** Per-serving macros. */
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG?: number;
}

// ─── Diary ──────────────────────────────────────────────────────────────────

export interface DiaryEntry {
  id: string;
  /** ISO-8601 date (YYYY-MM-DD). */
  date: string;
  meal: MealSlot;
  /** The food or recipe that was logged. */
  food: FoodItem;
  /** Number of servings consumed. */
  quantityServings: number;
  // Snapshot at log time so edits to the food item don't change history.
  snapshotKcal: number;
  snapshotProteinG: number;
  snapshotCarbG: number;
  snapshotFatG: number;
  /** ISO-8601 timestamp of when the entry was created. */
  loggedAt: string;
}

// ─── Derived helpers ─────────────────────────────────────────────────────────

export interface DayTotals {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

export function entryTotals(entry: DiaryEntry): DayTotals {
  return {
    kcal: entry.snapshotKcal * entry.quantityServings,
    proteinG: entry.snapshotProteinG * entry.quantityServings,
    carbG: entry.snapshotCarbG * entry.quantityServings,
    fatG: entry.snapshotFatG * entry.quantityServings,
  };
}

export function sumTotals(entries: DiaryEntry[]): DayTotals {
  return entries.reduce(
    (acc, e) => {
      const t = entryTotals(e);
      return {
        kcal: acc.kcal + t.kcal,
        proteinG: acc.proteinG + t.proteinG,
        carbG: acc.carbG + t.carbG,
        fatG: acc.fatG + t.fatG,
      };
    },
    { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 },
  );
}

// ─── USDA search ────────────────────────────────────────────────────────────

/** Lightweight shape returned from the USDA FoodData Central search API. */
export interface UsdaSearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: {
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }[];
}
