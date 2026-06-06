import type {
  UserProfile,
  TargetSnapshot,
  WeightEntry,
  DiaryEntry,
  FoodItem,
} from "./types";
import { entryTotals } from "./types";

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  profile: "srf:nourish-profile",
  targets: "srf:nourish-targets",
  weightLog: "srf:nourish-weight-log",
  diary: "srf:nourish-diary",
  customFoods: "srf:nourish-custom-foods",
  foodCache: "srf:nourish-food-cache",
  onboarded: "srf:nourish-onboarded",
  adaptiveLastRun: "srf:nourish-adaptive-last-run",
  waterLog: "srf:nourish-water-log",
  recentFoods: "srf:nourish-recent-foods",
} as const;

export const NOURISH_KEYS = KEYS;

// ─── Primitives ──────────────────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / parse errors
  }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile | null {
  return safeRead<UserProfile | null>(KEYS.profile, null);
}

export function setProfile(profile: UserProfile): void {
  safeWrite(KEYS.profile, profile);
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export function getTargets(): TargetSnapshot | null {
  return safeRead<TargetSnapshot | null>(KEYS.targets, null);
}

export function setTargets(snapshot: TargetSnapshot): void {
  safeWrite(KEYS.targets, snapshot);
}

// ─── Weight log ──────────────────────────────────────────────────────────────

export function getWeightLog(): WeightEntry[] {
  return safeRead<WeightEntry[]>(KEYS.weightLog, []);
}

export function addWeightEntry(entry: WeightEntry): void {
  const log = getWeightLog();
  // Replace an existing entry for the same date (one weigh-in per day).
  const idx = log.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    log[idx] = entry;
  } else {
    log.push(entry);
  }
  safeWrite(KEYS.weightLog, log);
}

export function deleteWeightEntry(id: string): void {
  const log = getWeightLog().filter((e) => e.id !== id);
  safeWrite(KEYS.weightLog, log);
}

// ─── Diary ───────────────────────────────────────────────────────────────────

export function getDiaryEntries(): DiaryEntry[] {
  return safeRead<DiaryEntry[]>(KEYS.diary, []);
}

export function getDiaryForDate(date: string): DiaryEntry[] {
  return getDiaryEntries().filter((e) => e.date === date);
}

export function addDiaryEntry(entry: DiaryEntry): void {
  const entries = getDiaryEntries();
  entries.push(entry);
  safeWrite(KEYS.diary, entries);
}

export function updateDiaryEntry(updated: DiaryEntry): void {
  const entries = getDiaryEntries().map((e) =>
    e.id === updated.id ? updated : e,
  );
  safeWrite(KEYS.diary, entries);
}

export function deleteDiaryEntry(id: string): void {
  const entries = getDiaryEntries().filter((e) => e.id !== id);
  safeWrite(KEYS.diary, entries);
}

// ─── Custom foods ─────────────────────────────────────────────────────────────

export function getCustomFoods(): FoodItem[] {
  return safeRead<FoodItem[]>(KEYS.customFoods, []);
}

export function saveCustomFood(food: FoodItem): void {
  const foods = getCustomFoods();
  const idx = foods.findIndex((f) => f.id === food.id);
  if (idx >= 0) {
    foods[idx] = food;
  } else {
    foods.push(food);
  }
  safeWrite(KEYS.customFoods, foods);
}

export function deleteCustomFood(id: string): void {
  const foods = getCustomFoods().filter((f) => f.id !== id);
  safeWrite(KEYS.customFoods, foods);
}

// ─── USDA search cache ────────────────────────────────────────────────────────

interface CacheEntry {
  query: string;
  results: unknown;
  cachedAt: number;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function getFoodCacheEntry(query: string): unknown | null {
  const cache = safeRead<CacheEntry[]>(KEYS.foodCache, []);
  const entry = cache.find(
    (e) =>
      e.query === query.trim().toLowerCase() &&
      Date.now() - e.cachedAt < CACHE_TTL_MS,
  );
  return entry?.results ?? null;
}

export function setFoodCacheEntry(query: string, results: unknown): void {
  const cache = safeRead<CacheEntry[]>(KEYS.foodCache, []);
  const key = query.trim().toLowerCase();
  const idx = cache.findIndex((e) => e.query === key);
  const entry: CacheEntry = { query: key, results, cachedAt: Date.now() };
  if (idx >= 0) {
    cache[idx] = entry;
  } else {
    cache.push(entry);
    // Keep cache from growing unboundedly — evict oldest beyond 200 entries.
    if (cache.length > 200) {
      cache.sort((a, b) => a.cachedAt - b.cachedAt);
      cache.splice(0, cache.length - 200);
    }
  }
  safeWrite(KEYS.foodCache, cache);
}

// ─── Onboarding flag ──────────────────────────────────────────────────────────

export function isOnboarded(): boolean {
  return safeRead<boolean>(KEYS.onboarded, false);
}

export function setOnboarded(value: boolean): void {
  safeWrite(KEYS.onboarded, value);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Returns today's date in YYYY-MM-DD, local time. */
export function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Generates a simple unique ID (timestamp + random suffix). */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Adaptive TDEE tracking ───────────────────────────────────────────────────

export function getAdaptiveLastRun(): string | null {
  return safeRead<string | null>(KEYS.adaptiveLastRun, null);
}

export function setAdaptiveLastRun(date: string): void {
  safeWrite(KEYS.adaptiveLastRun, date);
}

// ─── Recent foods ─────────────────────────────────────────────────────────────

const RECENT_FOODS_MAX = 20;

/** Returns the most recently logged foods, most recent first. */
export function getRecentFoods(): FoodItem[] {
  return safeRead<FoodItem[]>(KEYS.recentFoods, []);
}

/** Pushes a food to the front of the recent list; deduplicates by id; caps at 20. */
export function pushRecentFood(food: FoodItem): void {
  const list = getRecentFoods().filter((f) => f.id !== food.id);
  list.unshift(food);
  safeWrite(KEYS.recentFoods, list.slice(0, RECENT_FOODS_MAX));
}

// ─── Water log ────────────────────────────────────────────────────────────────

export interface WaterEntry {
  date: string;       // YYYY-MM-DD
  mlConsumed: number; // ml consumed that day
  goalMl: number;     // daily goal (default 2000ml)
}

export function getWaterLog(): WaterEntry[] {
  return safeRead<WaterEntry[]>(KEYS.waterLog, []);
}

export function getWaterForDate(date: string): WaterEntry {
  const log = getWaterLog();
  return log.find((e) => e.date === date) ?? { date, mlConsumed: 0, goalMl: 2000 };
}

export function setWaterForDate(entry: WaterEntry): void {
  const log = getWaterLog();
  const idx = log.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    log[idx] = entry;
  } else {
    log.push(entry);
  }
  safeWrite(KEYS.waterLog, log);
}

// ─── Protein streak ───────────────────────────────────────────────────────────

export function getProteinStreak(targetProteinG: number, threshold = 0.85): number {
  const allEntries = getDiaryEntries();
  if (allEntries.length === 0) return 0;

  const today = new Date();
  let streak = 0;

  for (let daysBack = 1; daysBack <= 365; daysBack++) {
    const d = new Date(today);
    d.setDate(today.getDate() - daysBack);
    // Format LOCAL date — diary entries use todayString() which is local.
    // Using d.toISOString() would shift the comparison by one day for any
    // user east of UTC and silently break their streak.
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const dayEntries = allEntries.filter((e) => e.date === dateStr);
    if (dayEntries.length === 0) break;

    const protein = dayEntries.reduce((s, e) => s + entryTotals(e).proteinG, 0);
    if (protein < targetProteinG * threshold) break;

    streak++;
  }

  return streak;
}
