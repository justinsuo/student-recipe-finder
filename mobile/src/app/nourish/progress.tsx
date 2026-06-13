/**
 * Nourish → Progress. Three sections backed by the shared Nourish engine:
 *   1. Weight log (add entry + recent list + tiny trend bars)
 *   2. Calories this week (last 7 diary days vs. calorie target)
 *   3. Streak & stats (protein streak flame + meals logged this week)
 * Re-renders via useKVRaw on the diary / weight / profile keys so edits made
 * elsewhere (logging a meal, weighing in) flow straight through.
 */
import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";

import { Screen, ScreenHeader } from "~/components/Screen";
import {
  Txt,
  Row,
  Spacer,
  Card,
  Button,
  Field,
  Badge,
  EmptyState,
  SectionHeading,
  Divider,
} from "~/components/ui";
import { WeeklyBars } from "~/components/Charts";
import { toast } from "~/components/Toast";
import { tap } from "~/lib/haptics";
import { useKVRaw } from "~/lib/store";
import { nourish, useTargets } from "~/lib/stores/nourish";
import { sumTotals } from "@/lib/nourish/types";
import { colors, space, radius, font } from "~/theme";
import { Feather } from "@expo/vector-icons";

// KV keys the engine writes to — subscribe so the screen stays live.
const DIARY_KEY = "srf:nourish-diary";
const WEIGHT_KEY = "srf:nourish-weight-log";
const PROFILE_KEY = "srf:nourish-profile";

const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const KG_PER_LB = 0.45359237;

function fmt(n: number, dp = 1): string {
  return Number.isFinite(n) ? n.toFixed(dp).replace(/\.0$/, "") : "0";
}

function prettyDate(iso: string): string {
  // iso is YYYY-MM-DD (local). Parse parts to avoid UTC drift.
  const [y, m, d] = iso.split("-").map((p) => Number(p));
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Progress() {
  // Reactive subscriptions — any write to these keys re-renders the screen.
  const diaryRaw = useKVRaw(DIARY_KEY);
  useKVRaw(WEIGHT_KEY);
  useKVRaw(PROFILE_KEY);

  const targets = useTargets();
  const profile = nourish.getProfile();
  const imperial = profile?.preferredUnits === "imperial";
  const unit = imperial ? "lb" : "kg";

  const [weightInput, setWeightInput] = useState("");

  // ─── Weight ────────────────────────────────────────────────────────────────
  const weightLog = nourish.getWeightLog();
  const sortedWeights = useMemo(
    () => [...weightLog].sort((a, b) => a.date.localeCompare(b.date)),
    [weightLog],
  );
  const recentWeights = useMemo(
    () => sortedWeights.slice(-10),
    [sortedWeights],
  );
  const toDisplay = (kg: number) => (imperial ? kg / KG_PER_LB : kg);

  const latest = sortedWeights[sortedWeights.length - 1];
  const previous = sortedWeights[sortedWeights.length - 2];
  const deltaKg = latest && previous ? latest.weightKg - previous.weightKg : 0;
  const deltaDisplay = imperial ? deltaKg / KG_PER_LB : deltaKg;

  const onAddWeight = () => {
    const raw = parseFloat(weightInput.replace(",", "."));
    if (!Number.isFinite(raw) || raw <= 0) {
      toast("Enter a weight first", "error");
      return;
    }
    const weightKg = imperial ? raw * KG_PER_LB : raw;
    nourish.addWeightEntry({
      id: nourish.newId(),
      date: nourish.todayString(),
      weightKg,
    });
    tap();
    setWeightInput("");
    toast(`Logged ${fmt(raw)} ${unit}`, "success");
  };

  // Tiny trend bars from the last ~10 weigh-ins (normalised around min/max).
  const weightBars = useMemo(
    () =>
      recentWeights.map((w) => ({
        label: prettyDate(w.date).split(" ")[1] ?? "",
        value: toDisplay(w.weightKg),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recentWeights, imperial],
  );

  // ─── Calories this week ──────────────────────────────────────────────────────
  const week = useMemo(() => {
    const today = new Date();
    const days: { iso: string; label: string; kcal: number; meals: number }[] = [];
    for (let back = 6; back >= 0; back--) {
      const d = new Date(today);
      d.setDate(today.getDate() - back);
      const iso = nourish.dateToLocalString(d);
      const entries = nourish.getDiaryForDate(iso);
      days.push({
        iso,
        label: WEEKDAY_SHORT[d.getDay()],
        kcal: Math.round(sumTotals(entries).kcal),
        meals: entries.length,
      });
    }
    return days;
    // Recompute whenever the diary store changes (diaryRaw is the raw KV value).
  }, [diaryRaw]);

  const calorieData = week.map((d) => ({ label: d.label, value: d.kcal }));
  const totalMealsWeek = week.reduce((s, d) => s + d.meals, 0);
  const daysLogged = week.filter((d) => d.meals > 0).length;
  const avgKcal = daysLogged
    ? Math.round(week.reduce((s, d) => s + d.kcal, 0) / daysLogged)
    : 0;

  // ─── Streak / stats ──────────────────────────────────────────────────────────
  const streak = nourish.getProteinStreak(targets.proteinG);

  const hasAnyData = weightLog.length > 0 || totalMealsWeek > 0;

  if (!hasAnyData) {
    return (
      <Screen>
        <ScreenHeader title="Progress" back />
        <EmptyState
          emoji="📈"
          title="No progress yet"
          subtitle="Log a meal or weigh in to start tracking your week. Your weight trend, calories, and protein streak show up here."
          action={
            <Button
              title="Log a meal"
              icon="plus"
              accentKey="nourish"
              variant="accent"
              onPress={() => router.push("/nourish/log-food")}
            />
          }
        />
        <Spacer h={space.lg} />
        {/* Still let people record their first weigh-in straight away. */}
        <Card>
          <SectionHeading title="Add a weigh-in" />
          <Row gap={space.sm} align="flex-end">
            <View style={{ flex: 1 }}>
              <Field
                label={`Weight (${unit})`}
                placeholder={imperial ? "e.g. 165" : "e.g. 75"}
                keyboardType="decimal-pad"
                value={weightInput}
                onChangeText={setWeightInput}
                onSubmitEditing={onAddWeight}
                returnKeyType="done"
              />
            </View>
            <Button title="Add" icon="plus" onPress={onAddWeight} />
          </Row>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Progress" back subtitle="Your week at a glance" />

      {/* ── Section 1 · Weight ─────────────────────────────────────────────── */}
      <Card>
        <SectionHeading title="Weight" />
        {latest ? (
          <Row gap={space.md} align="flex-end" style={{ marginBottom: space.md }}>
            <Txt variant="display">{fmt(toDisplay(latest.weightKg))}</Txt>
            <Txt variant="heading" muted style={{ marginBottom: 4 }}>
              {unit}
            </Txt>
            {previous ? (
              <View style={{ marginBottom: 6, marginLeft: "auto" }}>
                <Badge
                  label={`${deltaDisplay > 0 ? "+" : ""}${fmt(deltaDisplay)} ${unit}`}
                  tone={deltaDisplay <= 0 ? "pantry" : "nourish"}
                  icon={deltaDisplay > 0 ? "trending-up" : "trending-down"}
                />
              </View>
            ) : null}
          </Row>
        ) : (
          <Txt variant="body" muted style={{ marginBottom: space.md }}>
            No weigh-ins yet — add your first below.
          </Txt>
        )}

        <Row gap={space.sm} align="flex-end">
          <View style={{ flex: 1 }}>
            <Field
              label={`Today's weight (${unit})`}
              placeholder={imperial ? "e.g. 165" : "e.g. 75"}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              onSubmitEditing={onAddWeight}
              returnKeyType="done"
            />
          </View>
          <Button title="Add" icon="plus" onPress={onAddWeight} />
        </Row>

        {recentWeights.length >= 2 ? (
          <>
            <Spacer h={space.lg} />
            <Txt variant="label" style={{ marginBottom: space.sm }}>
              Recent trend
            </Txt>
            <WeeklyBars data={weightBars} color={colors.carrot} height={96} />
          </>
        ) : null}

        {recentWeights.length > 0 ? (
          <>
            <Spacer h={space.md} />
            <Divider />
            <Spacer h={space.sm} />
            {[...recentWeights].reverse().map((w, i, arr) => (
              <View key={w.id}>
                <Row justify="space-between" style={{ paddingVertical: 8 }}>
                  <Txt variant="body">{prettyDate(w.date)}</Txt>
                  <Txt variant="subheading">
                    {fmt(toDisplay(w.weightKg))} {unit}
                  </Txt>
                </Row>
                {i < arr.length - 1 ? <Divider style={{ opacity: 0.5 }} /> : null}
              </View>
            ))}
          </>
        ) : null}
      </Card>

      <Spacer h={space.lg} />

      {/* ── Section 2 · Calories this week ─────────────────────────────────── */}
      <Card>
        <SectionHeading title="Calories this week" />
        <Row gap={space.lg} style={{ marginBottom: space.md }}>
          <View>
            <Txt variant="caption" muted>
              Daily target
            </Txt>
            <Txt variant="subheading">{targets.calorieTarget.toLocaleString()} kcal</Txt>
          </View>
          {daysLogged > 0 ? (
            <View>
              <Txt variant="caption" muted>
                Avg / logged day
              </Txt>
              <Txt variant="subheading">{avgKcal.toLocaleString()} kcal</Txt>
            </View>
          ) : null}
        </Row>
        <WeeklyBars
          data={calorieData}
          target={targets.calorieTarget}
          color={colors.carrot}
          height={132}
        />
        <Spacer h={space.sm} />
        <Row gap={6} align="center">
          <View
            style={{
              width: 14,
              height: 3,
              borderRadius: 2,
              backgroundColor: colors.basil,
            }}
          />
          <Txt variant="caption" muted>
            Bars show kcal logged · target {targets.calorieTarget.toLocaleString()} kcal
          </Txt>
        </Row>
      </Card>

      <Spacer h={space.lg} />

      {/* ── Section 3 · Streak & stats ─────────────────────────────────────── */}
      <Card>
        <SectionHeading title="Streak & stats" />
        <Row gap={space.md}>
          <View style={[styleStat, { backgroundColor: colors.carrotTint }]}>
            <Row gap={4} align="center">
              <Feather name="zap" size={20} color={colors.carrotShadow} />
              <Txt variant="display" color={colors.carrotShadow}>
                {streak}
              </Txt>
            </Row>
            <Txt variant="label" center>
              day protein streak
            </Txt>
            <Txt variant="caption" muted center>
              ≥85% of {Math.round(targets.proteinG)}g
            </Txt>
          </View>

          <View style={[styleStat, { backgroundColor: colors.basilTint }]}>
            <Txt variant="display" color={colors.basilShadow}>
              {totalMealsWeek}
            </Txt>
            <Txt variant="label" center>
              meals this week
            </Txt>
            <Txt variant="caption" muted center>
              across {daysLogged} {daysLogged === 1 ? "day" : "days"}
            </Txt>
          </View>
        </Row>
        {streak === 0 ? (
          <>
            <Spacer h={space.md} />
            <Txt variant="caption" muted center>
              Hit your protein target today to start a streak 🔥
            </Txt>
          </>
        ) : null}
      </Card>

      <Spacer h={space.xl} />
    </Screen>
  );
}

const styleStat = {
  flex: 1,
  borderRadius: radius.lg,
  paddingVertical: space.lg,
  paddingHorizontal: space.md,
  alignItems: "center" as const,
  gap: 4,
};
