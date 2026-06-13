/**
 * Cooking streak — the Duolingo-style "don't break the chain" reward.
 * Counts consecutive days the user cooks or logs food. Stored locally (and
 * synced like other srf: keys). recordActivity() is called from cook-complete
 * and food logging; the home screen shows a 🔥 chip.
 */
import { kv } from "@shared/platform/kv";
import { useKVRaw } from "./store";

const KEY = "srf:cook-streak";

type StreakState = { count: number; lastDate: string | null; best: number };

function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayDiff(fromISO: string, toISO: string): number {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86_400_000);
}

function read(): StreakState {
  try {
    const raw = kv().getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (typeof s?.count === "number") return { count: s.count, lastDate: s.lastDate ?? null, best: s.best ?? s.count };
    }
  } catch {
    /* ignore */
  }
  return { count: 0, lastDate: null, best: 0 };
}

function write(s: StreakState): void {
  try {
    kv().setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export type StreakView = { count: number; best: number; activeToday: boolean };

/** Current streak, treating it as broken if the last activity was >1 day ago. */
export function getStreak(): StreakView {
  const s = read();
  const today = todayStr();
  const active = s.lastDate ? dayDiff(s.lastDate, today) <= 1 : false;
  return { count: active ? s.count : 0, best: s.best, activeToday: s.lastDate === today };
}

/**
 * Record a day of activity. Increments on a new consecutive day, resets after a
 * gap, no-ops if already counted today. Returns whether the streak grew + if it
 * hit a milestone (for a bigger celebration).
 */
export function recordActivity(): { count: number; increased: boolean; milestone: boolean } {
  const s = read();
  const today = todayStr();
  if (s.lastDate === today) return { count: s.count, increased: false, milestone: false };
  const count = s.lastDate && dayDiff(s.lastDate, today) === 1 ? s.count + 1 : 1;
  write({ count, lastDate: today, best: Math.max(s.best, count) });
  return { count, increased: true, milestone: [3, 7, 14, 30, 50, 100, 365].includes(count) };
}

/** Reactive streak for the home screen. */
export function useStreak(): StreakView {
  useKVRaw(KEY);
  return getStreak();
}
