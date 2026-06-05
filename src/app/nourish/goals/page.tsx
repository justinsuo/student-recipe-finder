"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { NourishShell } from "@/components/nourish/NourishShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getProfile,
  getTargets,
  setTargets,
  todayString,
} from "@/lib/nourish/storage";
import { deriveTargets, maxWeeklyRateKg } from "@/lib/nourish/calcEngine";
import type { GoalMode, TargetSnapshot } from "@/lib/nourish/types";

const MODE_OPTIONS: { value: GoalMode; label: string; description: string }[] = [
  { value: "cut", label: "Lose weight", description: "Eat below maintenance to drop fat." },
  { value: "maintain", label: "Maintain", description: "Hold weight, fuel daily activity." },
  { value: "bulk", label: "Gain weight", description: "Eat above maintenance to build mass." },
  { value: "recomp", label: "Recomp", description: "Maintain calories, push protein up." },
];

export default function NourishGoalsPage() {
  const toast = useToast();
  const [snapshot, setSnapshot] = useState<TargetSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(getTargets());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <NourishShell title="Goals." description="Loading…">
        <div className="h-48 animate-pulse rounded-2xl bg-stone-100" />
      </NourishShell>
    );
  }

  if (!snapshot) {
    return (
      <NourishShell
        title="Set your goals."
        description="Finish onboarding first — that gives Nourish a starting calorie + macro target it can tune over time."
      >
        <div className="rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-700 shadow-sm">
          Head back to{" "}
          <a className="font-semibold text-emerald-700 hover:underline" href="/nourish">
            Nourish
          </a>{" "}
          to set up your profile.
        </div>
      </NourishShell>
    );
  }

  function update<K extends keyof TargetSnapshot>(key: K, val: TargetSnapshot[K]) {
    setSnapshot((s) => (s ? { ...s, [key]: val } : s));
  }

  function recomputeFromProfile() {
    if (!snapshot) return;
    const profile = getProfile();
    if (!profile) {
      toast.error("Profile missing — set up your profile in Settings first.");
      return;
    }
    const fresh = deriveTargets(
      profile,
      snapshot.mode,
      snapshot.weeklyRateKg,
      "formula",
      todayString(),
    );
    setSnapshot(fresh);
    toast.info(
      "Recomputed — targets pulled from your latest profile + activity level.",
    );
  }

  function save() {
    if (!snapshot) return;
    setSaving(true);
    const next: TargetSnapshot = {
      ...snapshot,
      effectiveFrom: todayString(),
      source: "manual",
    };
    setTargets(next);
    setSnapshot(next);
    setSaving(false);
    toast.success(`Goals saved — daily target now ${next.calorieTarget} kcal.`);
  }

  const profile = getProfile();
  const rateRange = profile
    ? maxWeeklyRateKg(profile.weightKg, snapshot.mode)
    : { min: -1, max: 1 };

  return (
    <NourishShell
      title="Goals."
      description="What you're aiming for. Calorie + macro targets the rest of Nourish (and AI Chef) reads from."
    >
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Goal type"
          title="What are you working toward?"
          tone="emerald"
        />
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {MODE_OPTIONS.map((opt) => {
            const active = snapshot.mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("mode", opt.value)}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4 text-left shadow-sm shadow-emerald-200 transition-all motion-safe:scale-[1.01]"
                    : "rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50/50"
                }
              >
                <p className="text-sm font-semibold text-stone-900">
                  {opt.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {(snapshot.mode === "cut" || snapshot.mode === "bulk") && (
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            eyebrow="Pace"
            title={`Weekly rate (${snapshot.weeklyRateKg >= 0 ? "+" : ""}${snapshot.weeklyRateKg.toFixed(2)} kg/week)`}
            description={
              snapshot.mode === "cut"
                ? "We cap losses at ~1% of bodyweight per week. Faster than that and you'll burn through muscle and willpower."
                : "We cap gains at ~0.5% of bodyweight per week (lean bulk). Faster than that is mostly fat."
            }
            tone="amber"
          />
          <input
            type="range"
            min={rateRange.min}
            max={rateRange.max}
            step={0.05}
            value={snapshot.weeklyRateKg}
            onChange={(e) => update("weeklyRateKg", parseFloat(e.target.value))}
            className="mt-4 w-full accent-emerald-600"
            aria-label="Weekly rate"
          />
          <div className="mt-1 flex justify-between text-[11px] text-stone-500">
            <span>{rateRange.min.toFixed(2)} kg/wk</span>
            <span>{rateRange.max.toFixed(2)} kg/wk</span>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            eyebrow="Calorie + macro targets"
            title="Your daily numbers."
            description="Override anything below. Tap recompute to pull fresh numbers from your profile + chosen mode."
            tone="violet"
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Sparkles size={14} />}
            onClick={recomputeFromProfile}
          >
            Recompute
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Calories"
            unit="kcal/day"
            value={snapshot.calorieTarget}
            onChange={(v) => update("calorieTarget", v)}
          />
          <NumberField
            label="Protein"
            unit="g/day"
            value={snapshot.proteinG}
            onChange={(v) => update("proteinG", v)}
          />
          <NumberField
            label="Carbs"
            unit="g/day"
            value={snapshot.carbG}
            onChange={(v) => update("carbG", v)}
          />
          <NumberField
            label="Fat"
            unit="g/day"
            value={snapshot.fatG}
            onChange={(v) => update("fatG", v)}
          />
          <NumberField
            label="Fiber"
            unit="g/day"
            value={snapshot.fiberG}
            onChange={(v) => update("fiberG", v)}
          />
        </div>
        <p className="mt-4 text-[11px] text-stone-500">
          Source: <span className="font-semibold uppercase text-stone-700">{snapshot.source}</span> · effective from {snapshot.effectiveFrom}
        </p>
      </section>

      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          leftIcon={
            saving ? <Loader2 size={14} className="animate-spin" /> : undefined
          }
        >
          {saving ? "Saving…" : "Save goals"}
        </Button>
      </div>

      <p className="text-[11px] text-stone-500">
        Nutrition estimates are for general tracking only and may vary by brand,
        portion, and preparation. Not medical advice.
      </p>
    </NourishShell>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(0, Math.round(parseFloat(e.target.value) || 0)))}
          className="w-full bg-transparent text-lg font-semibold tabular-nums text-stone-900 outline-none"
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          {unit}
        </span>
      </div>
    </label>
  );
}
