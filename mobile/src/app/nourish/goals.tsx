/**
 * Nourish · Goals (modal)
 * Set body stats + goal, see engine-computed calorie & macro targets, then
 * tweak the four numbers by hand if you like. Persists profile + a TargetSnapshot
 * using the exact shared Nourish calc engine the website uses.
 */
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { Screen, ScreenHeader } from "~/components/Screen";
import {
  Txt,
  Row,
  Spacer,
  Card,
  Button,
  Pill,
  Field,
  Divider,
  SectionHeading,
} from "~/components/ui";
import { toast } from "~/components/Toast";
import { tap } from "~/lib/haptics";
import { colors, space, radius, accent, AccentKey } from "~/theme";
import { nourish, saveTargets, useProfile, useTargets } from "~/lib/stores/nourish";

import {
  deriveTargets,
  cmToInches,
  inchesToCm,
  inchesToFeetAndInches,
  feetAndInchesToCm,
  kgToLbs,
  lbsToKg,
} from "@/lib/nourish/calcEngine";
import type {
  ActivityLevel,
  GoalMode,
  Sex,
  PreferredUnits,
  UserProfile,
} from "@/lib/nourish/types";

// ─── Option metadata ─────────────────────────────────────────────────────────

const SEX_OPTS: { label: string; value: Sex }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const ACTIVITY_OPTS: { label: string; value: ActivityLevel }[] = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Light", value: "light" },
  { label: "Moderate", value: "moderate" },
  { label: "Very active", value: "very_active" },
  { label: "Extra active", value: "extra_active" },
];

const GOAL_OPTS: {
  label: string;
  value: GoalMode;
  icon: React.ComponentProps<typeof Feather>["name"];
  blurb: string;
}[] = [
  { label: "Cut", value: "cut", icon: "trending-down", blurb: "Lose fat in a calorie deficit." },
  { label: "Maintain", value: "maintain", icon: "minus", blurb: "Hold steady at maintenance." },
  { label: "Bulk", value: "bulk", icon: "trending-up", blurb: "Gain muscle in a surplus." },
  { label: "Recomp", value: "recomp", icon: "repeat", blurb: "Eat at maintenance, build slowly." },
];

// Sensible default weekly rates (kg/week). Negative = loss.
const DEFAULT_RATE: Record<GoalMode, number> = {
  cut: -0.45,
  maintain: 0,
  bulk: 0.25,
  recomp: 0,
};

const MACRO_ROWS: {
  key: "proteinG" | "carbG" | "fatG" | "fiberG";
  label: string;
  tone: AccentKey;
  icon: React.ComponentProps<typeof Feather>["name"];
}[] = [
  { key: "proteinG", label: "Protein", tone: "protein", icon: "zap" },
  { key: "carbG", label: "Carbs", tone: "carbs", icon: "droplet" },
  { key: "fatG", label: "Fat", tone: "fat", icon: "circle" },
  { key: "fiberG", label: "Fiber", tone: "fiber", icon: "feather" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numOrNull(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export default function Goals() {
  const profile = useProfile();
  const targets = useTargets();

  // Units (drives input display only — storage stays metric).
  const [units, setUnits] = useState<PreferredUnits>(profile?.preferredUnits ?? "imperial");
  const imperial = units === "imperial";

  // ── Body stats (kept as display strings; canonical conversion at save) ──
  const initCm = profile?.heightCm ?? 173;
  const initKg = profile?.weightKg ?? 70;
  const { feet: initFt, inches: initIn } = inchesToFeetAndInches(cmToInches(initCm));

  const [heightCmStr, setHeightCmStr] = useState(String(Math.round(initCm)));
  const [ftStr, setFtStr] = useState(String(initFt));
  const [inStr, setInStr] = useState(String(initIn));
  const [weightStr, setWeightStr] = useState(
    imperial ? String(Math.round(kgToLbs(initKg))) : String(Math.round(initKg)),
  );
  const [ageStr, setAgeStr] = useState(String(profile?.age ?? 22));
  const [sex, setSex] = useState<Sex>(profile?.sex ?? "male");
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activityLevel ?? "moderate");

  // ── Goal ──
  const [mode, setMode] = useState<GoalMode>(targets?.mode ?? "maintain");
  const [weeklyRateKg, setWeeklyRateKg] = useState<number>(
    targets?.weeklyRateKg ?? DEFAULT_RATE[targets?.mode ?? "maintain"],
  );

  // ── Editable target numbers ──
  const [calStr, setCalStr] = useState(String(targets?.calorieTarget ?? 2000));
  const [proteinStr, setProteinStr] = useState(String(targets?.proteinG ?? 120));
  const [carbStr, setCarbStr] = useState(String(targets?.carbG ?? 230));
  const [fatStr, setFatStr] = useState(String(targets?.fatG ?? 65));
  const [fiberStr, setFiberStr] = useState(String(targets?.fiberG ?? 28));

  // Tracks whether the four numbers were typed by hand since the last compute.
  const [manual, setManual] = useState<boolean>((targets?.source ?? "formula") === "manual");
  const [error, setError] = useState<string | null>(null);

  const macroStr: Record<string, string> = {
    proteinG: proteinStr,
    carbG: carbStr,
    fatG: fatStr,
    fiberG: fiberStr,
  };
  const setMacro: Record<string, (v: string) => void> = {
    proteinG: setProteinStr,
    carbG: setCarbStr,
    fatG: setFatStr,
    fiberG: setFiberStr,
  };

  // Build a canonical (metric) profile from the current form, or null if invalid.
  const builtProfile: UserProfile | null = useMemo(() => {
    let heightCm: number | null;
    if (imperial) {
      const ft = numOrNull(ftStr);
      const inch = numOrNull(inStr) ?? 0;
      heightCm = ft == null ? null : feetAndInchesToCm(ft, inch);
    } else {
      heightCm = numOrNull(heightCmStr);
    }
    const rawWeight = numOrNull(weightStr);
    const weightKg = rawWeight == null ? null : imperial ? lbsToKg(rawWeight) : rawWeight;
    const age = numOrNull(ageStr);

    if (heightCm == null || weightKg == null || age == null) return null;
    if (heightCm < 90 || heightCm > 250 || weightKg < 25 || weightKg > 350 || age < 13 || age > 100) {
      return null;
    }
    return {
      heightCm: Math.round(heightCm),
      weightKg: Math.round(weightKg * 10) / 10,
      age: Math.round(age),
      sex,
      activityLevel: activity,
      preferredUnits: units,
    };
  }, [imperial, ftStr, inStr, heightCmStr, weightStr, ageStr, sex, activity, units]);

  // ── Actions ──

  function pickMode(next: GoalMode) {
    setMode(next);
    setWeeklyRateKg(DEFAULT_RATE[next]);
  }

  function applyUnits(next: PreferredUnits) {
    if (next === units) return;
    tap();
    // Convert current weight / height strings so the on-screen numbers stay true.
    const w = numOrNull(weightStr);
    if (w != null) {
      setWeightStr(
        next === "imperial" ? String(Math.round(kgToLbs(w))) : String(Math.round(lbsToKg(w))),
      );
    }
    if (next === "imperial") {
      const cm = numOrNull(heightCmStr);
      if (cm != null) {
        const { feet, inches } = inchesToFeetAndInches(cmToInches(cm));
        setFtStr(String(feet));
        setInStr(String(inches));
      }
    } else {
      const ft = numOrNull(ftStr) ?? 0;
      const inch = numOrNull(inStr) ?? 0;
      setHeightCmStr(String(Math.round(feetAndInchesToCm(ft, inch))));
    }
    setUnits(next);
  }

  function recompute() {
    if (!builtProfile) {
      setError("Enter a valid height, weight, and age first.");
      return;
    }
    setError(null);
    tap();
    const snap = deriveTargets(builtProfile, mode, weeklyRateKg, "formula", nourish.todayString());
    setCalStr(String(snap.calorieTarget));
    setProteinStr(String(snap.proteinG));
    setCarbStr(String(snap.carbG));
    setFatStr(String(snap.fatG));
    setFiberStr(String(snap.fiberG));
    setManual(false);
  }

  function editNumber(setter: (v: string) => void, v: string) {
    setter(v);
    setManual(true);
  }

  function onSave() {
    if (!builtProfile) {
      setError("Enter a valid height, weight, and age before saving.");
      return;
    }
    const cal = numOrNull(calStr);
    const p = numOrNull(proteinStr);
    const c = numOrNull(carbStr);
    const f = numOrNull(fatStr);
    const fib = numOrNull(fiberStr);
    if (cal == null || p == null || c == null || f == null || fib == null) {
      setError("Every target number needs a value.");
      return;
    }
    if (cal < 800 || cal > 6000) {
      setError("Calorie target should be between 800 and 6000.");
      return;
    }
    setError(null);

    // Persist canonical profile.
    nourish.setProfile(builtProfile);

    // Save the target snapshot. Source is "formula" only if the numbers still
    // exactly match a fresh engine derivation; otherwise it's a manual override.
    const fresh = deriveTargets(builtProfile, mode, weeklyRateKg, "formula", nourish.todayString());
    const matchesEngine =
      !manual &&
      Math.round(cal) === fresh.calorieTarget &&
      clampInt(p, 0, 9999) === fresh.proteinG &&
      clampInt(c, 0, 9999) === fresh.carbG &&
      clampInt(f, 0, 9999) === fresh.fatG &&
      clampInt(fib, 0, 9999) === fresh.fiberG;

    saveTargets({
      effectiveFrom: nourish.todayString(),
      mode,
      weeklyRateKg,
      calorieTarget: clampInt(cal, 800, 6000),
      proteinG: clampInt(p, 0, 9999),
      carbG: clampInt(c, 0, 9999),
      fatG: clampInt(f, 0, 9999),
      fiberG: clampInt(fib, 0, 9999),
      source: matchesEngine ? "formula" : "manual",
    });

    toast("Goals saved", "reward");
    router.back();
  }

  // ── Derived display ──
  const rateLbs = Math.abs(kgToLbs(weeklyRateKg));
  const showRate = mode === "cut" || mode === "bulk";
  const calNum = numOrNull(calStr);
  const macroKcal =
    (numOrNull(proteinStr) ?? 0) * 4 +
    (numOrNull(carbStr) ?? 0) * 4 +
    (numOrNull(fatStr) ?? 0) * 9;

  return (
    <Screen>
      <ScreenHeader title="Goals" subtitle="Dial in your daily targets" back />

      {/* Units toggle */}
      <Row gap={8} justify="flex-end" style={{ marginBottom: space.md }}>
        <Pill
          label="Metric"
          tone="nourish"
          selected={!imperial}
          onPress={() => applyUnits("metric")}
        />
        <Pill
          label="Imperial"
          tone="nourish"
          selected={imperial}
          onPress={() => applyUnits("imperial")}
        />
      </Row>

      {/* ── Body stats ── */}
      <Card>
        <SectionHeading title="About you" />
        <Row gap={space.sm} align="flex-end">
          {imperial ? (
            <>
              <View style={{ flex: 1 }}>
                <Field
                  label="Height (ft)"
                  value={ftStr}
                  onChangeText={setFtStr}
                  keyboardType="number-pad"
                  placeholder="5"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="in"
                  value={inStr}
                  onChangeText={setInStr}
                  keyboardType="number-pad"
                  placeholder="9"
                />
              </View>
            </>
          ) : (
            <View style={{ flex: 1 }}>
              <Field
                label="Height (cm)"
                value={heightCmStr}
                onChangeText={setHeightCmStr}
                keyboardType="number-pad"
                placeholder="173"
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Field
              label={imperial ? "Weight (lb)" : "Weight (kg)"}
              value={weightStr}
              onChangeText={setWeightStr}
              keyboardType="numeric"
              placeholder={imperial ? "154" : "70"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Age"
              value={ageStr}
              onChangeText={setAgeStr}
              keyboardType="number-pad"
              placeholder="22"
            />
          </View>
        </Row>

        <Spacer h={space.lg} />
        <Txt variant="label">Sex</Txt>
        <Spacer h={space.sm} />
        <Row gap={8} wrap>
          {SEX_OPTS.map((o) => (
            <Pill
              key={o.value}
              label={o.label}
              tone="nourish"
              selected={sex === o.value}
              onPress={() => setSex(o.value)}
            />
          ))}
        </Row>

        <Spacer h={space.lg} />
        <Txt variant="label">Activity level</Txt>
        <Spacer h={space.sm} />
        <Row gap={8} wrap>
          {ACTIVITY_OPTS.map((o) => (
            <Pill
              key={o.value}
              label={o.label}
              tone="nourish"
              selected={activity === o.value}
              onPress={() => setActivity(o.value)}
            />
          ))}
        </Row>
      </Card>

      <Spacer h={space.lg} />

      {/* ── Goal mode ── */}
      <Card>
        <SectionHeading title="Your goal" />
        <Row gap={8} wrap>
          {GOAL_OPTS.map((o) => (
            <Pill
              key={o.value}
              label={o.label}
              icon={o.icon}
              tone="nourish"
              selected={mode === o.value}
              onPress={() => pickMode(o.value)}
            />
          ))}
        </Row>
        <Spacer h={space.sm} />
        <Txt variant="caption" muted>
          {GOAL_OPTS.find((o) => o.value === mode)?.blurb}
        </Txt>

        {showRate ? (
          <>
            <Spacer h={space.lg} />
            <Row justify="space-between">
              <Txt variant="label">Weekly rate</Txt>
              <Txt variant="label" color={colors.text}>
                {mode === "cut" ? "−" : "+"}
                {rateLbs.toFixed(2)} lb/wk
              </Txt>
            </Row>
            <Spacer h={space.sm} />
            <Row gap={8} wrap>
              {(mode === "cut"
                ? [-0.23, -0.45, -0.68, -0.9]
                : [0.11, 0.25, 0.34, 0.45]
              ).map((r) => (
                <Pill
                  key={r}
                  label={`${Math.abs(kgToLbs(r)).toFixed(2)} lb`}
                  tone="nourish"
                  selected={Math.abs(weeklyRateKg - r) < 0.01}
                  onPress={() => setWeeklyRateKg(r)}
                />
              ))}
            </Row>
          </>
        ) : null}

        <Spacer h={space.lg} />
        <Button
          title="Compute from profile"
          icon="cpu"
          variant="ghost"
          size="md"
          full
          onPress={recompute}
        />
      </Card>

      <Spacer h={space.lg} />

      {/* ── Targets (editable) ── */}
      <Card>
        <SectionHeading title="Daily targets" />
        <Txt variant="caption" muted>
          {manual
            ? "Manual override — your numbers, exactly as typed."
            : "Computed from the Mifflin-St Jeor engine. Tweak any field to override."}
        </Txt>

        <Spacer h={space.lg} />
        <Field
          label="Calories (kcal)"
          value={calStr}
          onChangeText={(v) => editNumber(setCalStr, v)}
          keyboardType="number-pad"
          placeholder="2000"
        />

        <Spacer h={space.md} />
        <Divider />
        <Spacer h={space.md} />

        {MACRO_ROWS.map((m, i) => {
          const a = accent[m.tone];
          return (
            <View key={m.key}>
              <Row gap={space.md} align="center">
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radius.sm,
                    backgroundColor: a.tint,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={m.icon} size={18} color={a.shadow} />
                </View>
                <Txt variant="subheading" style={{ flex: 1 }}>
                  {m.label}
                </Txt>
                <View style={{ width: 110 }}>
                  <Field
                    value={macroStr[m.key]}
                    onChangeText={(v) => {
                      setMacro[m.key](v);
                      setManual(true);
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    style={{ textAlign: "right" }}
                  />
                </View>
                <Txt variant="label" style={{ width: 14 }}>
                  g
                </Txt>
              </Row>
              {i < MACRO_ROWS.length - 1 ? <Spacer h={space.md} /> : null}
            </View>
          );
        })}

        <Spacer h={space.lg} />
        <Row
          justify="space-between"
          style={{
            backgroundColor: colors.surfaceSoft,
            borderRadius: radius.md,
            paddingHorizontal: space.md,
            paddingVertical: space.sm,
          }}
        >
          <Txt variant="caption" muted>
            Macros add up to
          </Txt>
          <Txt variant="label" color={colors.text}>
            {Math.round(macroKcal)} kcal
            {calNum != null && Math.abs(macroKcal - calNum) > 60
              ? `  (target ${calNum})`
              : ""}
          </Txt>
        </Row>
      </Card>

      {error ? (
        <>
          <Spacer h={space.md} />
          <Row
            gap={8}
            style={{
              backgroundColor: colors.tomatoTint,
              borderRadius: radius.md,
              padding: space.md,
            }}
          >
            <Feather name="alert-circle" size={16} color={colors.tomato} />
            <Txt variant="label" color={colors.tomato} style={{ flex: 1 }}>
              {error}
            </Txt>
          </Row>
        </>
      ) : null}

      <Spacer h={space.xl} />
      <Button title="Save goals" icon="check" size="lg" full onPress={onSave} />
      <Spacer h={space.lg} />
    </Screen>
  );
}
