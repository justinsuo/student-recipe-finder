"use client";

import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { sumTotals } from "@/lib/nourish/types";
import type { DiaryEntry, TargetSnapshot, WeightEntry } from "@/lib/nourish/types";

interface Props {
  diary: DiaryEntry[];
  weights: WeightEntry[];
  targets: TargetSnapshot;
}

function dateRange(daysAgo: number, dayCount: number): string[] {
  const result: string[] = [];
  for (let i = daysAgo + dayCount - 1; i >= daysAgo; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

interface WeekStats {
  days: string[];
  loggedDays: number;
  avgKcal: number;
  avgProteinG: number;
  avgCarbG: number;
  avgFatG: number;
  weightChange: number | null;
  startWeight: number | null;
  endWeight: number | null;
}

function computeWeek(
  diary: DiaryEntry[],
  weights: WeightEntry[],
  dates: string[],
): WeekStats {
  const byDate = new Map<string, DiaryEntry[]>();
  for (const e of diary) {
    if (dates.includes(e.date)) {
      const arr = byDate.get(e.date) ?? [];
      arr.push(e);
      byDate.set(e.date, arr);
    }
  }

  const loggedDates = dates.filter((d) => byDate.has(d));
  const n = loggedDates.length || 1;

  const allEntries = loggedDates.flatMap((d) => byDate.get(d) ?? []);
  const totals = sumTotals(allEntries);

  // Weight change over the week
  const weekWeights = weights.filter((w) => dates.includes(w.date)).sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = weekWeights[0]?.weightKg ?? null;
  const endWeight = weekWeights[weekWeights.length - 1]?.weightKg ?? null;
  const weightChange = startWeight !== null && endWeight !== null ? endWeight - startWeight : null;

  return {
    days: dates,
    loggedDays: loggedDates.length,
    avgKcal: Math.round(totals.kcal / n),
    avgProteinG: parseFloat((totals.proteinG / n).toFixed(1)),
    avgCarbG: parseFloat((totals.carbG / n).toFixed(1)),
    avgFatG: parseFloat((totals.fatG / n).toFixed(1)),
    weightChange,
    startWeight,
    endWeight,
  };
}

function StatCell({ label, value, unit, targetValue, higherIsBetter = false }: {
  label: string;
  value: number;
  unit: string;
  targetValue?: number;
  higherIsBetter?: boolean;
}) {
  const pct = targetValue ? Math.round((value / targetValue) * 100) : null;
  const good = pct !== null && (higherIsBetter ? pct >= 90 : pct >= 85 && pct <= 115);

  return (
    <div className="flex flex-col items-center rounded-xl bg-stone-50 px-3 py-2.5 text-center">
      <p className={clsx("text-xl font-bold tabular-nums", good ? "text-emerald-600" : "text-stone-800")}>
        {value.toLocaleString()}
        <span className="text-xs font-normal">{unit}</span>
      </p>
      <p className="text-[10px] text-stone-500">{label}</p>
      {pct !== null && (
        <p className={clsx("text-[9px] font-medium mt-0.5", good ? "text-emerald-500" : "text-stone-400")}>
          {pct}% of target
        </p>
      )}
    </div>
  );
}

function WeekCard({ stats, targets, label }: { stats: WeekStats; targets: TargetSnapshot; label: string }) {
  const wc = stats.weightChange;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900">{label}</h3>
        <span className="text-[10px] text-stone-400">
          {stats.loggedDays}/7 days logged
        </span>
      </div>

      {stats.loggedDays === 0 ? (
        <p className="text-xs text-stone-400 py-2">No meals logged this week.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCell label="Avg kcal/day" value={stats.avgKcal} unit="" targetValue={targets.calorieTarget} />
            <StatCell label="Protein avg" value={stats.avgProteinG} unit="g" targetValue={targets.proteinG} higherIsBetter />
            <StatCell label="Carbs avg" value={stats.avgCarbG} unit="g" targetValue={targets.carbG} />
            <StatCell label="Fat avg" value={stats.avgFatG} unit="g" targetValue={targets.fatG} />
          </div>

          {wc !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2">
              {wc < -0.05 ? (
                <TrendingDown size={14} className="text-sky-500" />
              ) : wc > 0.05 ? (
                <TrendingUp size={14} className="text-amber-500" />
              ) : (
                <Minus size={14} className="text-stone-400" />
              )}
              <p className="text-xs text-stone-700">
                Weight change:{" "}
                <strong className={clsx(
                  wc < -0.05 ? "text-sky-600" : wc > 0.05 ? "text-amber-600" : "text-stone-600",
                )}>
                  {wc >= 0 ? "+" : ""}
                  {wc.toFixed(2)} kg
                </strong>
                {" "}({stats.startWeight?.toFixed(1)} → {stats.endWeight?.toFixed(1)} kg)
              </p>
            </div>
          )}

          {/* Adherence bar */}
          <div>
            <div className="flex justify-between text-[10px] text-stone-400 mb-1">
              <span>Logging adherence</span>
              <span>{Math.round((stats.loggedDays / 7) * 100)}%</span>
            </div>
            <div className="flex gap-0.5">
              {stats.days.map((d, i) => (
                <div
                  key={d}
                  title={d}
                  className={clsx(
                    "h-2 flex-1 rounded-sm",
                    // mark future days lighter
                    d > new Date().toISOString().slice(0, 10)
                      ? "bg-stone-100"
                      : stats.loggedDays > i
                        ? "bg-emerald-400"
                        : "bg-stone-200",
                  )}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function WeeklyReview({ diary, weights, targets }: Props) {
  const thisWeek = dateRange(0, 7);
  const lastWeek = dateRange(7, 7);

  const thisStats = computeWeek(diary, weights, thisWeek);
  const lastStats = computeWeek(diary, weights, lastWeek);

  return (
    <div className="space-y-3">
      <WeekCard stats={thisStats} targets={targets} label="This week" />
      {lastStats.loggedDays > 0 && (
        <WeekCard stats={lastStats} targets={targets} label="Last week" />
      )}
    </div>
  );
}
