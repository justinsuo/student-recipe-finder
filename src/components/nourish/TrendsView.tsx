"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getWeightLog,
  getDiaryEntries,
  getTargets,
  todayString,
} from "@/lib/nourish/storage";
import { ewmaWeight } from "@/lib/nourish/calcEngine";
import { sumTotals } from "@/lib/nourish/types";
import type { WeightEntry, DiaryEntry, TargetSnapshot } from "@/lib/nourish/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dateRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

// ─── Weight trend chart ───────────────────────────────────────────────────────

function WeightChart({ weights }: { weights: WeightEntry[] }) {
  if (weights.length < 2) {
    return (
      <EmptyState
        emoji="⚖️"
        title="Not enough weigh-ins yet"
        description="Log your weight for at least 2 days to see a trend. Use the Today tab to log quickly."
        tone="emerald"
        className="py-10"
      />
    );
  }

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const alpha = 0.1;

  // Build EWMA trend points using reduce to avoid mutable re-assignment
  const { data } = sorted.reduce<{
    data: { date: string; weight: number; trend: number }[];
    ema: number;
  }>(
    (acc, w) => {
      const nextEma = alpha * w.weightKg + (1 - alpha) * acc.ema;
      return {
        ema: nextEma,
        data: [
          ...acc.data,
          { date: shortDate(w.date), weight: w.weightKg, trend: parseFloat(nextEma.toFixed(2)) },
        ],
      };
    },
    { data: [], ema: sorted[0].weightKg },
  );

  const min = Math.min(...data.map((d) => d.weight)) - 1;
  const max = Math.max(...data.map((d) => d.weight)) + 1;

  // Rate of change (trend endpoint − trend start over # weeks)
  const trendStart = data[0].trend;
  const trendEnd = data[data.length - 1].trend;
  const weeks = Math.max((data.length - 1) / 7, 1);
  const weeklyRate = (trendEnd - trendStart) / weeks;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-stone-800">Weight trend</h3>
        <p className="text-xs text-stone-500">
          {weeklyRate >= 0 ? "+" : ""}
          {weeklyRate.toFixed(2)} kg/wk (smoothed)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#78716c" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 10, fill: "#78716c" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(1)}`}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e7e5e4" }}
            formatter={(val, name) => [
              typeof val === "number" ? `${val.toFixed(2)} kg` : val,
              name === "trend" ? "Smoothed" : "Logged",
            ]}
          />
          {/* Raw dots */}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#d6d3d1"
            strokeWidth={0}
            dot={{ fill: "#a8a29e", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            name="weight"
          />
          {/* EWMA trend line */}
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
            name="trend"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Weekly calorie chart ─────────────────────────────────────────────────────

function WeeklyCalorieChart({
  diary,
  target,
}: {
  diary: DiaryEntry[];
  target: number;
}) {
  const last14 = dateRange(14);

  // Group diary by date
  const byDate = new Map<string, DiaryEntry[]>();
  for (const e of diary) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }

  const data = last14.map((date) => {
    const entries = byDate.get(date) ?? [];
    const kcal = entries.length > 0 ? Math.round(sumTotals(entries).kcal) : null;
    return { date: shortDate(date), kcal, isoDate: date };
  });

  const hasData = data.some((d) => d.kcal !== null);

  if (!hasData) {
    return (
      <EmptyState
        emoji="📊"
        title="No calorie data yet"
        description="Start logging meals and you'll see your daily vs. target comparison here."
        tone="emerald"
        className="py-10"
      />
    );
  }

  const today = todayString();
  const todayIdx = last14.indexOf(today);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-stone-800">Daily calories (14 days)</h3>
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <span className="inline-block h-1 w-4 rounded-full bg-rose-400" />target
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#78716c" }}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#78716c" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e7e5e4" }}
            formatter={(val) => [typeof val === "number" ? `${val} kcal` : val, "Calories"]}
          />
          <ReferenceLine y={target} stroke="#f87171" strokeDasharray="4 2" strokeWidth={1.5} />
          <Bar
            dataKey="kcal"
            fill="#10b981"
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
            name="kcal"
          />
        </BarChart>
      </ResponsiveContainer>
      {todayIdx >= 0 && data[todayIdx].kcal !== null && (
        <p className="text-center text-xs text-stone-500">
          Today: <strong className="text-stone-700">{data[todayIdx].kcal} kcal</strong>
          {" "}vs target {target}
        </p>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function TrendsView() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [targets, setTargets] = useState<TargetSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setWeights(getWeightLog());
    setDiary(getDiaryEntries());
    setTargets(getTargets());
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hydrated) return null;

  const ewma = ewmaWeight(weights.map((w) => ({ date: w.date, weightKg: w.weightKg })));
  const currentWeight = ewma ?? weights[weights.length - 1]?.weightKg;

  return (
    <div className="space-y-6">
      {/* Current weight summary */}
      {currentWeight !== undefined && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Current weight (smoothed)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-stone-900">
            {currentWeight.toFixed(1)} <span className="text-base font-normal text-stone-500">kg</span>
          </p>
          {weights.length > 0 && (
            <p className="mt-0.5 text-xs text-stone-400">
              From {weights.length} weigh-in{weights.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Weight chart */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <WeightChart weights={weights} />
      </div>

      {/* Calorie chart */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        {targets ? (
          <WeeklyCalorieChart diary={diary} target={targets.calorieTarget} />
        ) : (
          <EmptyState
            emoji="📈"
            title="Set up your profile first"
            description="Head to the Profile tab to get your calorie target, then come back here."
            tone="emerald"
            className="py-8"
          />
        )}
      </div>

      <p className="text-center text-[11px] text-stone-400">
        ⚠️ Trends are estimates. The smoothed weight line uses exponential
        weighting (10-day memory) to reduce daily noise.
      </p>
    </div>
  );
}
