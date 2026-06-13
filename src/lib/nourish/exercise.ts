// Exercise log. Plain localStorage, mirrors the diary pattern. Caller can
// opt to subtract exercise calories from the daily remaining via the
// includeExercise setting (see settings).

import { kv } from "@shared/platform/kv";

const KEY = "srf:nourish-exercise-log";

export type ExerciseKind =
  | "walking"
  | "running"
  | "cycling"
  | "weights"
  | "sport"
  | "yoga"
  | "other";

export interface ExerciseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  kind: ExerciseKind;
  /** Display name shown in the diary; falls back to `kind` if blank. */
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  notes?: string;
  createdAt: string;
}

// MET-based default kcal/min estimates for a 70 kg person. Caller can override
// caloriesBurned in the form. Numbers are intentionally conservative to avoid
// inflating the calorie credit.
export const EXERCISE_DEFAULTS: Record<ExerciseKind, { label: string; kcalPerMin: number }> = {
  walking: { label: "Walking", kcalPerMin: 4 },
  running: { label: "Running", kcalPerMin: 10 },
  cycling: { label: "Cycling", kcalPerMin: 8 },
  weights: { label: "Weight training", kcalPerMin: 6 },
  sport: { label: "Sports / pickup", kcalPerMin: 8 },
  yoga: { label: "Yoga / stretching", kcalPerMin: 3 },
  other: { label: "Other", kcalPerMin: 5 },
};

function read<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = kv().getItem(KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    kv().setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getExerciseLog(): ExerciseEntry[] {
  return read<ExerciseEntry[]>([]);
}

export function getExerciseForDate(date: string): ExerciseEntry[] {
  return getExerciseLog().filter((e) => e.date === date);
}

export function addExerciseEntry(entry: ExerciseEntry): void {
  const log = getExerciseLog();
  log.push(entry);
  write(log);
}

export function deleteExerciseEntry(id: string): void {
  write(getExerciseLog().filter((e) => e.id !== id));
}

export function sumExerciseCalories(entries: ExerciseEntry[]): number {
  return entries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
}
