// 7-day meal plan storage. Each cell is keyed by (date, slot) and points
// at either a database Recipe ID or a saved NourishMeal ID.

import type { MealSlot } from "./types";

const KEY = "srf:nourish-meal-plan";

export type PlanItemKind = "recipe" | "meal";

export interface PlanItem {
  /** YYYY-MM-DD */
  date: string;
  slot: MealSlot;
  kind: PlanItemKind;
  /** Recipe.id when kind=recipe, NourishMeal.id when kind=meal. */
  refId: string;
  /** Cached display name so the calendar can render without a lookup. */
  name: string;
  /** Cached per-serving macros (kcal/protein) so the grid stays fast. */
  kcal?: number;
  proteinG?: number;
}

function read<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getPlan(): PlanItem[] {
  return read<PlanItem[]>([]);
}

export function getPlanForDate(date: string): PlanItem[] {
  return getPlan().filter((p) => p.date === date);
}

export function getPlanCell(
  date: string,
  slot: MealSlot,
): PlanItem | undefined {
  return getPlan().find((p) => p.date === date && p.slot === slot);
}

export function upsertPlanItem(item: PlanItem): void {
  const list = getPlan();
  const idx = list.findIndex(
    (p) => p.date === item.date && p.slot === item.slot,
  );
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  write(list);
}

export function removePlanItem(date: string, slot: MealSlot): void {
  write(getPlan().filter((p) => !(p.date === date && p.slot === slot)));
}

/**
 * Returns the next 7 days starting from `today`, each as a date string
 * (YYYY-MM-DD).
 */
export function nextSevenDays(today: string): string[] {
  const base = new Date(today + "T00:00:00");
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
