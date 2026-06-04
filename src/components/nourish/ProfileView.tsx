"use client";

import { useState, useMemo, useEffect } from "react";
import { clsx } from "clsx";
import { Save, RefreshCw, Flame, Zap } from "lucide-react";
import { DataExport } from "./DataExport";
import { Button } from "@/components/ui/Button";
import { SelectablePill } from "@/components/ui/SelectablePill";
import {
  deriveTargets,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToFeetAndInches,
  feetAndInchesToCm,
} from "@/lib/nourish/calcEngine";
import {
  getProfile,
  getTargets,
  setProfile,
  setTargets,
  setOnboarded,
} from "@/lib/nourish/storage";
import type {
  Sex,
  ActivityLevel,
  GoalMode,
  UserProfile,
  PreferredUnits,
} from "@/lib/nourish/types";

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string }[] = [
  { id: "sedentary", label: "Sedentary" },
  { id: "light", label: "Lightly active" },
  { id: "moderate", label: "Moderate" },
  { id: "very_active", label: "Very active" },
  { id: "extra_active", label: "Extra active" },
];

const GOAL_OPTIONS: { id: GoalMode; label: string; emoji: string }[] = [
  { id: "cut", label: "Lose weight", emoji: "📉" },
  { id: "maintain", label: "Maintain", emoji: "⚖️" },
  { id: "bulk", label: "Build muscle", emoji: "💪" },
  { id: "recomp", label: "Recomp", emoji: "🔄" },
];

function rateOptions(mode: GoalMode, weightKg: number): { label: string; value: number }[] {
  if (mode === "cut") {
    return [
      { label: "Gradual (−0.25 kg/wk)", value: -0.25 },
      { label: "Moderate (−0.5 kg/wk)", value: -0.5 },
      { label: `Aggressive (−${(weightKg * 0.01).toFixed(2)} kg/wk)`, value: -(weightKg * 0.01) },
    ];
  }
  if (mode === "bulk") {
    return [
      { label: "Lean bulk (+0.25 kg/wk)", value: 0.25 },
      { label: "Moderate (+0.5 kg/wk)", value: 0.5 },
    ];
  }
  return [{ label: "At maintenance", value: 0 }];
}

const MACRO_COLOURS = {
  protein: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
  carbs: { bar: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
  fat: { bar: "bg-violet-400", text: "text-violet-700", bg: "bg-violet-50", ring: "ring-violet-200" },
};

interface Props {
  onResetProfile: () => void;
}

export function ProfileView({ onResetProfile }: Props) {
  const [hydrated, setHydrated] = useState(false);

  // Stats
  const [units, setUnits] = useState<PreferredUnits>("metric");
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [age, setAge] = useState(22);
  const [sex, setSex] = useState<Sex | undefined>("male");
  const [lbs, setLbs] = useState(Math.round(kgToLbs(70)));
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);

  // Goal
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [mode, setMode] = useState<GoalMode>("maintain");
  const [weeklyRate, setWeeklyRate] = useState(0);

  const [saved, setSaved] = useState(false);

  // Load from storage on mount — multiple setState calls here are intentional
  // (hydrating form fields from localStorage on client).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const profile = getProfile();
    const targets = getTargets();
    if (profile) {
      setUnits(profile.preferredUnits);
      setWeightKg(profile.weightKg);
      setHeightCm(profile.heightCm);
      setAge(profile.age);
      setSex(profile.sex);
      setActivity(profile.activityLevel);
      setLbs(Math.round(kgToLbs(profile.weightKg)));
      const totalIn = cmToInches(profile.heightCm);
      const fi = inchesToFeetAndInches(totalIn);
      setFeet(fi.feet);
      setInches(fi.inches);
    }
    if (targets) {
      setMode(targets.mode);
      setWeeklyRate(targets.weeklyRateKg);
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const profile: UserProfile = useMemo(
    () => ({ heightCm, weightKg, age, sex, activityLevel: activity, preferredUnits: units }),
    [heightCm, weightKg, age, sex, activity, units],
  );

  const preview = useMemo(
    () => deriveTargets(profile, mode, weeklyRate),
    [profile, mode, weeklyRate],
  );

  function handleWeightImperial(v: number) {
    setLbs(v);
    setWeightKg(parseFloat(lbsToKg(v).toFixed(1)));
  }
  function handleWeightMetric(v: number) {
    setWeightKg(v);
    setLbs(Math.round(kgToLbs(v)));
  }
  function handleHeightFeet(f: number) {
    const fc = Math.max(0, f);
    setFeet(fc);
    setHeightCm(parseFloat(feetAndInchesToCm(fc, inches).toFixed(1)));
  }
  function handleHeightInches(i: number) {
    const ic = Math.max(0, Math.min(11, i));
    setInches(ic);
    setHeightCm(parseFloat(feetAndInchesToCm(feet, ic).toFixed(1)));
  }
  function handleHeightMetric(v: number) {
    setHeightCm(v);
    const total = cmToInches(v);
    const fi = inchesToFeetAndInches(total);
    setFeet(fi.feet);
    setInches(fi.inches);
  }

  function handleModeChange(m: GoalMode) {
    setMode(m);
    const opts = rateOptions(m, weightKg);
    setWeeklyRate(opts[0].value);
  }

  function handleSave() {
    setProfile(profile);
    setTargets(preview);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!hydrated) return null;

  const inputCls =
    "w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-stone-900">Body stats</h2>

        {/* Units */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-600">Units:</span>
          {(["metric", "imperial"] as PreferredUnits[]).map((u) => (
            <SelectablePill key={u} active={units === u} onClick={() => setUnits(u)} ariaSemantics="checked" showCheck={false}>
              {u === "metric" ? "kg / cm" : "lbs / ft"}
            </SelectablePill>
          ))}
        </div>

        {/* Weight */}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Weight ({units === "imperial" ? "lbs" : "kg"})
          </span>
          <input
            type="number"
            min={units === "imperial" ? 44 : 20}
            max={units === "imperial" ? 1100 : 500}
            step={units === "imperial" ? 0.5 : 0.1}
            value={units === "imperial" ? lbs : weightKg}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) {
                if (units === "imperial") handleWeightImperial(v);
                else handleWeightMetric(v);
              }
            }}
            className={inputCls}
          />
        </label>

        {/* Height */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Height ({units === "imperial" ? "ft / in" : "cm"})
          </span>
          {units === "imperial" ? (
            <div className="flex gap-2">
              <input type="number" min={3} max={8} value={feet} onChange={(e) => handleHeightFeet(parseInt(e.target.value) || 0)} placeholder="ft" className={inputCls} />
              <input type="number" min={0} max={11} value={inches} onChange={(e) => handleHeightInches(parseInt(e.target.value) || 0)} placeholder="in" className={inputCls} />
            </div>
          ) : (
            <input type="number" min={100} max={280} step={0.5} value={heightCm} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleHeightMetric(v); }} className={inputCls} />
          )}
        </div>

        {/* Age */}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Age</span>
          <input type="number" min={14} max={100} value={age} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setAge(v); }} className={inputCls} />
        </label>

        {/* Sex */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Sex <span className="font-normal text-stone-400">(optional)</span></span>
          <div className="flex gap-2 flex-wrap">
            {([["male", "Male"], ["female", "Female"], [undefined, "Prefer not to say"]] as const).map(([v, label]) => (
              <SelectablePill key={label} active={sex === v} onClick={() => setSex(v)} ariaSemantics="checked" showCheck={false}>{label}</SelectablePill>
            ))}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-bold text-stone-900">Activity level</h2>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <SelectablePill key={opt.id} active={activity === opt.id} onClick={() => setActivity(opt.id)} ariaSemantics="checked" showCheck={false}>
              {opt.label}
            </SelectablePill>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-stone-900">Goal</h2>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleModeChange(opt.id)}
              aria-pressed={mode === opt.id}
              className={clsx(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                mode === opt.id ? "border-emerald-500 bg-emerald-50" : "border-stone-200 bg-white hover:border-emerald-300",
              )}
            >
              <span aria-hidden>{opt.emoji}</span>
              <span className={clsx("text-sm font-semibold", mode === opt.id ? "text-emerald-800" : "text-stone-800")}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {(mode === "cut" || mode === "bulk") && (
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">Pace</span>
            <div className="flex flex-wrap gap-2">
              {rateOptions(mode, weightKg).map((opt) => (
                <SelectablePill key={opt.value} active={weeklyRate === opt.value} onClick={() => setWeeklyRate(opt.value)} ariaSemantics="checked" showCheck={false}>
                  {opt.label}
                </SelectablePill>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 space-y-3">
        <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
          <Flame size={14} />
          Updated targets
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tabular-nums text-stone-900">{preview.calorieTarget.toLocaleString()}</span>
          <span className="text-stone-500 text-sm">kcal/day</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["Protein", preview.proteinG, "protein"],
              ["Carbs", preview.carbG, "carbs"],
              ["Fat", preview.fatG, "fat"],
            ] as [string, number, keyof typeof MACRO_COLOURS][]
          ).map(([name, grams, key]) => {
            const c = MACRO_COLOURS[key];
            return (
              <div key={name} className={clsx("rounded-xl border p-2.5 text-center ring-1", c.bg, c.ring)}>
                <p className={clsx("text-xl font-bold tabular-nums", c.text)}>{grams}<span className="text-xs font-normal">g</span></p>
                <p className="text-[11px] text-stone-500">{name}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-stone-500 flex items-center gap-1"><Zap size={11} className="text-amber-500" />Fiber: {preview.fiberG} g/day</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setOnboarded(false); onResetProfile(); }}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
        >
          <RefreshCw size={12} />
          Re-run setup wizard
        </button>

        <Button
          variant="primary"
          size="md"
          leftIcon={saved ? undefined : <Save size={15} />}
          onClick={handleSave}
        >
          {saved ? "Saved ✓" : "Save changes"}
        </Button>
      </div>

      <DataExport />

      <p className="text-center text-[11px] text-stone-400">
        ⚠️ Targets are estimates only — not medical advice. Consult a healthcare
        professional for medical conditions, pregnancy, or disordered eating history.
      </p>
    </div>
  );
}
