"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Droplets, Plus, Minus, Settings2 } from "lucide-react";
import { getWaterForDate, setWaterForDate, todayString } from "@/lib/nourish/storage";
import type { WaterEntry } from "@/lib/nourish/storage";

const QUICK_AMOUNTS_ML = [150, 250, 350, 500];

function mlToDisplay(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
}

export function WaterTracker() {
  const [entry, setEntry] = useState<WaterEntry>({ date: todayString(), mlConsumed: 0, goalMl: 2000 });
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const e = getWaterForDate(todayString());
    setEntry(e);
    setGoalInput(String(e.goalMl));
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hydrated) return null;

  function update(newMl: number) {
    const next = { ...entry, mlConsumed: Math.max(0, newMl) };
    setEntry(next);
    setWaterForDate(next);
  }

  function saveGoal() {
    const g = parseInt(goalInput);
    if (!isNaN(g) && g >= 500 && g <= 8000) {
      const next = { ...entry, goalMl: g };
      setEntry(next);
      setWaterForDate(next);
    }
    setEditGoal(false);
  }

  // Guard against a corrupted/zero goal in storage so the ring math
  // doesn't divide by zero and render 100% / Infinity glasses.
  const safeGoal = entry.goalMl > 0 ? entry.goalMl : 2000;
  const fraction = Math.min(entry.mlConsumed / safeGoal, 1);
  const pct = Math.round(fraction * 100);
  const glasses = Math.round(safeGoal / 250);
  const glassesConsumed = Math.round(entry.mlConsumed / 250);
  const met = entry.mlConsumed >= safeGoal;

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600">
          <Droplets size={13} />
          Water today
        </p>
        <button
          type="button"
          onClick={() => setEditGoal((v) => !v)}
          aria-label="Set water goal"
          className="grid h-6 w-6 place-items-center rounded-full text-stone-400 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Settings2 size={12} />
        </button>
      </div>

      {/* Goal editor */}
      {editGoal && (
        <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2">
          <span className="text-xs text-stone-600">Goal (ml):</span>
          <input
            type="number"
            min={500}
            max={8000}
            step={100}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveGoal(); }}
            className="w-20 rounded-lg border border-sky-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
            autoFocus
          />
          <button type="button" onClick={saveGoal} className="text-xs font-medium text-sky-700 hover:underline">Save</button>
          <button type="button" onClick={() => setEditGoal(false)} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-end gap-3">
        <div>
          <p className="text-3xl font-bold tabular-nums text-stone-900">
            {mlToDisplay(entry.mlConsumed)}
          </p>
          <p className="text-xs text-stone-400">of {mlToDisplay(entry.goalMl)} goal · {pct}%</p>
        </div>
        {met && (
          <span className="mb-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
            Goal met! 🎉
          </span>
        )}
      </div>

      {/* Glasses visual */}
      <div className="flex gap-1" aria-label={`${glassesConsumed} of ${glasses} glasses`}>
        {Array.from({ length: Math.min(glasses, 12) }, (_, i) => (
          <div
            key={i}
            className={clsx(
              "h-5 flex-1 rounded-sm transition-colors",
              i < glassesConsumed ? "bg-sky-400" : "bg-sky-100",
            )}
          />
        ))}
      </div>

      {/* Fill bar */}
      <div className="h-2 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-sky-400 motion-safe:transition-all motion-safe:duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={entry.mlConsumed}
          aria-valuemax={entry.goalMl}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_AMOUNTS_ML.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => update(entry.mlConsumed + ml)}
            className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            +{mlToDisplay(ml)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => update(entry.mlConsumed + 250)}
          aria-label="Add 250ml"
          className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Plus size={13} />
        </button>
        <button
          type="button"
          onClick={() => update(entry.mlConsumed - 250)}
          aria-label="Remove 250ml"
          className="grid h-7 w-7 place-items-center rounded-full border border-sky-200 text-sky-500 hover:bg-sky-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Minus size={13} />
        </button>
      </div>
    </div>
  );
}
