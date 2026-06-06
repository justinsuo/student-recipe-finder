// Logging streak helpers. A "streak day" is any day with at least one
// diary entry. Streak resets when a day has zero entries.

import type { DiaryEntry } from "./types";

/** Returns YYYY-MM-DD for a Date in local time. */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Current streak length — consecutive days ending at `today` (inclusive)
 * that have at least one diary entry. If today has no entry, we also
 * accept "yesterday-ending" streaks so users on the first hour of the
 * day still see their streak (they haven't logged breakfast yet).
 */
export function currentStreak(entries: DiaryEntry[], todayStr: string): number {
  const dates = new Set(entries.map((e) => e.date));
  if (dates.size === 0) return 0;
  const cursor = new Date(todayStr + "T00:00:00");
  // If today has no entry, start counting from yesterday — gives users
  // benefit of the doubt before they've logged their first meal of the day.
  if (!dates.has(ymd(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let count = 0;
  while (dates.has(ymd(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
    if (count > 365) break; // safety cap
  }
  return count;
}

/**
 * Best ever streak across the diary. Used as a small celebration when
 * current streak ties or beats it.
 */
export function bestStreak(entries: DiaryEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = Array.from(new Set(entries.map((e) => e.date))).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00");
    const curr = new Date(dates[i] + "T00:00:00");
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / 86_400_000,
    );
    if (diffDays === 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}
