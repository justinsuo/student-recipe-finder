"use client";

import { useState, useMemo } from "react";
import { clsx } from "clsx";
import { ChevronRight, ChevronLeft, Flame, Zap, Check } from "lucide-react";
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

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = ["About you", "Activity", "Your goal", "Your targets"] as const;

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string; description: string }[] = [
  { id: "sedentary", label: "Sedentary", description: "Desk job, little exercise" },
  { id: "light", label: "Lightly active", description: "Light exercise 1–3×/week" },
  { id: "moderate", label: "Moderate", description: "Exercise 3–5×/week" },
  { id: "very_active", label: "Very active", description: "Hard exercise 6–7×/week" },
  { id: "extra_active", label: "Extra active", description: "Physical job or 2×/day" },
];

const GOAL_OPTIONS: { id: GoalMode; label: string; emoji: string; description: string }[] = [
  { id: "cut", label: "Lose weight", emoji: "📉", description: "Calorie deficit + high protein to preserve muscle" },
  { id: "maintain", label: "Maintain", emoji: "⚖️", description: "Eat at TDEE — build habits and feel good" },
  { id: "bulk", label: "Build muscle", emoji: "💪", description: "Lean surplus — maximize muscle, minimize fat gain" },
  { id: "recomp", label: "Recomposition", emoji: "🔄", description: "Near TDEE with high protein — slow but sustainable" },
];

// ─── Rate selector helpers ────────────────────────────────────────────────────

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

// ─── Macro colour helpers ─────────────────────────────────────────────────────

const MACRO_COLOURS = {
  protein: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
  carbs: { bar: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
  fat: { bar: "bg-violet-400", text: "text-violet-700", bg: "bg-violet-50", ring: "ring-violet-200" },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<PreferredUnits>("metric");

  // Step 1 — body stats
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [age, setAge] = useState(22);
  const [sex, setSex] = useState<Sex | undefined>("male");
  // imperial helpers
  const [lbs, setLbs] = useState(Math.round(kgToLbs(70)));
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);

  // Step 2 — activity
  const [activity, setActivity] = useState<ActivityLevel>("moderate");

  // Step 3 — goal
  const [mode, setMode] = useState<GoalMode>("maintain");
  const [weeklyRate, setWeeklyRate] = useState(0);

  // Sync weeklyRate when mode changes
  function handleModeChange(m: GoalMode) {
    setMode(m);
    const opts = rateOptions(m, weightKg);
    setWeeklyRate(opts[0].value);
  }

  // ─── Live preview ───────────────────────────────────────────────────────────

  const profile: UserProfile = useMemo(
    () => ({
      heightCm,
      weightKg,
      age,
      sex,
      activityLevel: activity,
      preferredUnits: units,
    }),
    [heightCm, weightKg, age, sex, activity, units],
  );

  const preview = useMemo(
    () => deriveTargets(profile, mode, weeklyRate),
    [profile, mode, weeklyRate],
  );

  // ─── Imperial sync ──────────────────────────────────────────────────────────

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

  // ─── Save & complete ────────────────────────────────────────────────────────

  function handleFinish() {
    setProfile(profile);
    setTargets(preview);
    setOnboarded(true);
    onComplete();
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  const step1Valid =
    weightKg > 20 && weightKg < 500 &&
    heightCm > 100 && heightCm < 280 &&
    age >= 14 && age <= 100;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={clsx(
                "h-1.5 w-full rounded-full transition-all duration-300",
                i <= step ? "bg-emerald-500" : "bg-stone-200",
              )}
            />
            <span
              className={clsx(
                "hidden text-[10px] font-medium sm:block",
                i === step ? "text-emerald-700" : "text-stone-400",
              )}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1 — Body stats */}
      {step === 0 && (
        <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Tell us about yourself</h2>
            <p className="mt-1 text-sm text-stone-500">
              Used only to calculate your targets — stored on this device.
            </p>
          </div>

          {/* Units toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Units:</span>
            {(["metric", "imperial"] as PreferredUnits[]).map((u) => (
              <SelectablePill
                key={u}
                active={units === u}
                onClick={() => setUnits(u)}
                ariaSemantics="checked"
                showCheck={false}
              >
                {u === "metric" ? "kg / cm" : "lbs / ft"}
              </SelectablePill>
            ))}
          </div>

          {/* Weight */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">
              Current weight {units === "imperial" ? "(lbs)" : "(kg)"}
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
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          {/* Height */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">
              Height {units === "imperial" ? "(ft / in)" : "(cm)"}
            </span>
            {units === "imperial" ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min={3}
                    max={8}
                    value={feet}
                    onChange={(e) => handleHeightFeet(parseInt(e.target.value) || 0)}
                    placeholder="ft"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={inches}
                    onChange={(e) => handleHeightInches(parseInt(e.target.value) || 0)}
                    placeholder="in"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <input
                type="number"
                min={100}
                max={280}
                step={0.5}
                value={heightCm}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) handleHeightMetric(v);
                }}
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Age */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">Age</span>
            <input
              type="number"
              min={14}
              max={100}
              value={age}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) setAge(v);
              }}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          {/* Sex */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">
              Sex{" "}
              <span className="font-normal text-stone-400">
                (improves estimate — optional)
              </span>
            </span>
            <div className="flex gap-2">
              {([["male", "Male"], ["female", "Female"], [undefined, "Prefer not to say"]] as const).map(
                ([v, label]) => (
                  <SelectablePill
                    key={label}
                    active={sex === v}
                    onClick={() => setSex(v)}
                    ariaSemantics="checked"
                    showCheck={false}
                  >
                    {label}
                  </SelectablePill>
                ),
              )}
            </div>
          </div>

          <p className="rounded-xl bg-stone-50 px-3 py-2 text-[11px] text-stone-400">
            ⚠️ Calorie and macro targets are estimates based on general formulas.
            Consult a healthcare professional for medical conditions, pregnancy,
            or a history of disordered eating.
          </p>
        </div>
      )}

      {/* Step 2 — Activity */}
      {step === 1 && (
        <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-stone-900">How active are you?</h2>
            <p className="mt-1 text-sm text-stone-500">
              Think about your typical week including exercise and daily movement.
            </p>
          </div>
          <div className="space-y-2">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActivity(opt.id)}
                aria-pressed={activity === opt.id}
                className={clsx(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  activity === opt.id
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40",
                )}
              >
                <div>
                  <p className={clsx("text-sm font-semibold", activity === opt.id ? "text-emerald-800" : "text-stone-800")}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-stone-500">{opt.description}</p>
                </div>
                {activity === opt.id && (
                  <Check size={16} className="shrink-0 text-emerald-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Goal */}
      {step === 2 && (
        <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-stone-900">What&apos;s your goal?</h2>
            <p className="mt-1 text-sm text-stone-500">
              We&apos;ll set a calorie target and macro split that supports it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleModeChange(opt.id)}
                aria-pressed={mode === opt.id}
                className={clsx(
                  "flex flex-col rounded-xl border px-3 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  mode === opt.id
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40",
                )}
              >
                <span className="text-2xl" aria-hidden>{opt.emoji}</span>
                <span className={clsx("mt-1 text-sm font-semibold", mode === opt.id ? "text-emerald-800" : "text-stone-800")}>
                  {opt.label}
                </span>
                <span className="mt-0.5 text-xs text-stone-500 leading-tight">{opt.description}</span>
              </button>
            ))}
          </div>

          {/* Rate selector (cut / bulk only) */}
          {(mode === "cut" || mode === "bulk") && (
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Pace</span>
              <div className="flex flex-wrap gap-2">
                {rateOptions(mode, weightKg).map((opt) => (
                  <SelectablePill
                    key={opt.value}
                    active={weeklyRate === opt.value}
                    onClick={() => setWeeklyRate(opt.value)}
                    ariaSemantics="checked"
                    showCheck={false}
                  >
                    {opt.label}
                  </SelectablePill>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Live target preview */}
      {step === 3 && (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Your daily targets</h2>
            <p className="mt-1 text-sm text-stone-500">
              Calculated from your stats and goal. You can always adjust these later.
            </p>
          </div>

          {/* Calorie hero */}
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 px-5 py-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Flame size={22} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Daily calorie target
              </p>
              <p className="text-4xl font-bold text-stone-900 tabular-nums">
                {preview.calorieTarget.toLocaleString()}
                <span className="ml-1 text-base font-normal text-stone-500">kcal</span>
              </p>
            </div>
          </div>

          {/* Macro breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Protein", preview.proteinG, "protein"],
                ["Carbs", preview.carbG, "carbs"],
                ["Fat", preview.fatG, "fat"],
              ] as const
            ).map(([name, grams, key]) => {
              const c = MACRO_COLOURS[key];
              return (
                <div
                  key={name}
                  className={clsx(
                    "rounded-xl border p-3 text-center ring-1",
                    c.bg,
                    c.ring,
                  )}
                >
                  <p className={clsx("text-2xl font-bold tabular-nums", c.text)}>
                    {grams}
                    <span className="text-sm font-normal">g</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-stone-600">{name}</p>
                </div>
              );
            })}
          </div>

          {/* Fiber */}
          <p className="flex items-center gap-1.5 text-sm text-stone-500">
            <Zap size={13} className="text-amber-500" />
            Fiber target:{" "}
            <strong className="text-stone-700">{preview.fiberG} g/day</strong>
          </p>

          {/* Mode summary */}
          <p className="text-sm text-stone-500">
            {mode === "cut" && `A deficit of ~${Math.round((preview.calorieTarget < 2000 ? 2000 - preview.calorieTarget : 2500 - preview.calorieTarget))} kcal/day supports your goal.`}
            {mode === "bulk" && "A modest surplus helps muscle growth while minimising fat gain."}
            {mode === "maintain" && "Eating at TDEE keeps your weight stable."}
            {mode === "recomp" && "Near-maintenance with high protein supports body recomposition over time."}
          </p>

          <p className="rounded-xl bg-stone-50 px-3 py-2 text-[11px] text-stone-400">
            ⚠️ These are estimates — not medical advice. Consult a healthcare
            professional before making significant diet changes.
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button
            variant="ghost"
            size="md"
            leftIcon={<ChevronLeft size={16} />}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <Button
            variant="primary"
            size="md"
            rightIcon={<ChevronRight size={16} />}
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !step1Valid}
          >
            Continue
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={handleFinish}>
            Start tracking →
          </Button>
        )}
      </div>
    </div>
  );
}
