/**
 * Diary — a day-by-day food log. Step through dates, see each meal grouped with
 * per-meal calorie subtotals and a day total compared to the user's calorie
 * target, and delete individual entries. Re-renders reactively off the shared
 * nourish diary KV key so logging from elsewhere shows up immediately.
 */
import React, { useMemo } from "react";
import { View } from "react-native";

import { Screen, ScreenHeader } from "~/components/Screen";
import {
  Txt,
  Row,
  Spacer,
  Card,
  Press,
  Button,
  IconButton,
  Badge,
} from "~/components/ui";
import { toast } from "~/components/Toast";
import { tap, selection, success } from "~/lib/haptics";
import { useKVRaw } from "~/lib/store";
import { nourish, useTargets } from "~/lib/stores/nourish";
import { entryTotals, sumTotals } from "@/lib/nourish/types";
import type { DiaryEntry, MealSlot } from "@/lib/nourish/types";
import { colors, space, radius, accent } from "~/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { AccentKey } from "~/theme";

// ─── Meal metadata ────────────────────────────────────────────────────────────

const MEAL_ORDER: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_META: Record<
  MealSlot,
  { label: string; emoji: string; icon: React.ComponentProps<typeof Feather>["name"]; tone: AccentKey }
> = {
  breakfast: { label: "Breakfast", emoji: "🍳", icon: "sunrise", tone: "cheap" },
  lunch: { label: "Lunch", emoji: "🥗", icon: "sun", tone: "nourish" },
  dinner: { label: "Dinner", emoji: "🍝", icon: "sunset", tone: "ai-chef" },
  snack: { label: "Snack", emoji: "🍎", icon: "coffee", tone: "saved" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse a YYYY-MM-DD local-date string into a Date at local midnight. */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Format a local-date string as "Weekday, Mon D". */
function formatHeaderDate(s: string): string {
  const d = parseLocalDate(s);
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

/** Shift a local-date string by `delta` days, returning a new local-date string. */
function shiftDate(s: string, delta: number): string {
  const d = parseLocalDate(s);
  d.setDate(d.getDate() + delta);
  return nourish.dateToLocalString(d);
}

const fmtKcal = (n: number) => Math.round(n).toLocaleString();

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Diary() {
  // Re-render whenever the diary changes (logging / deleting from anywhere).
  const diaryRaw = useKVRaw("srf:nourish-diary");

  const today = nourish.todayString();
  const [date, setDate] = React.useState<string>(today);
  const target = useTargets();

  const isToday = date === today;
  // Don't let users page into the future — there's nothing logged there.
  const canGoNext = date < today;

  const entries = useMemo<DiaryEntry[]>(
    () => nourish.getDiaryForDate(date),
    // diaryRaw changes on every write, recompute per selected date too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date, diaryRaw],
  );

  const dayTotal = sumTotals(entries).kcal;
  const calorieTarget = target.calorieTarget || 0;
  const progress = calorieTarget > 0 ? Math.min(dayTotal / calorieTarget, 1) : 0;
  const over = calorieTarget > 0 && dayTotal > calorieTarget;
  const remaining = calorieTarget - dayTotal;

  // Group entries by meal slot, preserving meal display order.
  const grouped = useMemo(() => {
    return MEAL_ORDER.map((meal) => {
      const items = entries.filter((e) => e.meal === meal);
      const subtotal = sumTotals(items).kcal;
      return { meal, items, subtotal };
    }).filter((g) => g.items.length > 0);
  }, [entries]);

  function goPrev() {
    selection();
    setDate((d) => shiftDate(d, -1));
  }
  function goNext() {
    if (!canGoNext) return;
    selection();
    setDate((d) => shiftDate(d, 1));
  }
  function goToday() {
    tap();
    setDate(today);
  }

  function handleDelete(entry: DiaryEntry) {
    tap();
    nourish.deleteDiaryEntry(entry.id);
    success();
    toast(`Removed ${entry.food.name}`, "info");
  }

  return (
    <Screen>
      <ScreenHeader
        title="Diary"
        back
        right={
          !isToday ? (
            <Press onPress={goToday} haptic="selection">
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: colors.basilSoft,
                }}
              >
                <Txt variant="label" color={colors.basilShadow} weight="800">
                  Today
                </Txt>
              </View>
            </Press>
          ) : undefined
        }
      />

      {/* ── Date navigation ── */}
      <Card padded={false} style={{ padding: space.sm, marginBottom: space.lg }}>
        <Row justify="space-between" align="center">
          <IconButton
            icon="chevron-left"
            onPress={goPrev}
            size={44}
            bg={colors.surfaceSoft}
            color={colors.text}
          />
          <Press onPress={goToday} haptic="light" style={{ flex: 1, alignItems: "center" }}>
            <Txt variant="subheading" center weight="800">
              {formatHeaderDate(date)}
            </Txt>
            <Txt variant="caption" center>
              {isToday ? "Today" : "Tap to jump to today"}
            </Txt>
          </Press>
          <IconButton
            icon="chevron-right"
            onPress={goNext}
            size={44}
            bg={canGoNext ? colors.surfaceSoft : colors.oat}
            color={canGoNext ? colors.text : colors.textFaint}
          />
        </Row>
      </Card>

      {/* ── Day total + progress ── */}
      <Card elevation="md" style={{ marginBottom: space.lg }}>
        <Row justify="space-between" align="flex-end">
          <View>
            <Txt variant="label">Day total</Txt>
            <Row gap={6} align="baseline">
              <Txt variant="title" weight="800">
                {fmtKcal(dayTotal)}
              </Txt>
              <Txt variant="label">
                / {fmtKcal(calorieTarget)} kcal
              </Txt>
            </Row>
          </View>
          <Badge
            label={
              calorieTarget <= 0
                ? `${fmtKcal(dayTotal)} kcal`
                : over
                ? `${fmtKcal(dayTotal - calorieTarget)} over`
                : `${fmtKcal(remaining)} left`
            }
            tone={over ? "saved" : "nourish"}
            icon={over ? "alert-circle" : "target"}
            solid={over}
          />
        </Row>

        <Spacer h={space.md} />

        {/* progress bar */}
        <View
          style={{
            height: 12,
            borderRadius: radius.pill,
            backgroundColor: colors.oat,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${Math.max(progress, 0.02) * 100}%`,
              height: "100%",
              borderRadius: radius.pill,
              backgroundColor: over ? colors.tomato : colors.carrot,
            }}
          />
        </View>
        <Spacer h={space.xs} />
        <Txt variant="caption">
          {calorieTarget <= 0
            ? "Set a calorie target in Goals to track progress."
            : over
            ? `${Math.round((dayTotal / calorieTarget) * 100)}% of target`
            : `${Math.round(progress * 100)}% of ${fmtKcal(calorieTarget)} kcal target`}
        </Txt>
      </Card>

      {/* ── Meals or empty state ── */}
      {entries.length === 0 ? (
        <EmptyDay isToday={isToday} date={date} />
      ) : (
        grouped.map((group, i) => (
          <MealGroup
            key={group.meal}
            meal={group.meal}
            items={group.items}
            subtotal={group.subtotal}
            onDelete={handleDelete}
            style={{ marginBottom: i === grouped.length - 1 ? 0 : space.lg }}
          />
        ))
      )}

      {entries.length > 0 ? (
        <>
          <Spacer h={space.lg} />
          <Button
            title="Log food"
            icon="plus"
            full
            onPress={() => {
              tap();
              router.push("/nourish/log-food");
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}

// ─── Meal group card ────────────────────────────────────────────────────────────

function MealGroup({
  meal,
  items,
  subtotal,
  onDelete,
  style,
}: {
  meal: MealSlot;
  items: DiaryEntry[];
  subtotal: number;
  onDelete: (entry: DiaryEntry) => void;
  style?: any;
}) {
  const meta = MEAL_META[meal];
  return (
    <Card padded={false} style={[{ overflow: "hidden" }, style]}>
      {/* meal header */}
      <Row
        justify="space-between"
        align="center"
        style={{
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          backgroundColor: accent[meta.tone].tint,
        }}
      >
        <Row gap={8} align="center">
          <Txt variant="heading">{meta.emoji}</Txt>
          <Txt variant="subheading" weight="800">
            {meta.label}
          </Txt>
        </Row>
        <Txt variant="label" color={accent[meta.tone].shadow} weight="800">
          {fmtKcal(subtotal)} kcal
        </Txt>
      </Row>

      {/* entries */}
      <View style={{ paddingHorizontal: space.lg, paddingVertical: space.sm }}>
        {items.map((entry, idx) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            onDelete={onDelete}
            last={idx === items.length - 1}
          />
        ))}
      </View>
    </Card>
  );
}

// ─── Single entry row ────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  onDelete,
  last,
}: {
  entry: DiaryEntry;
  onDelete: (entry: DiaryEntry) => void;
  last: boolean;
}) {
  const kcal = entryTotals(entry).kcal;
  const servings = entry.quantityServings;
  const servingLabel = entry.food.servingDescription;
  // Render "1.5 × 100g" without trailing ".0"
  const qtyText = `${Number.isInteger(servings) ? servings : servings.toFixed(1)} × ${servingLabel}`;

  return (
    <Row
      justify="space-between"
      align="center"
      style={{
        paddingVertical: space.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.borderSoft,
      }}
    >
      <View style={{ flex: 1, paddingRight: space.md }}>
        <Txt variant="body" weight="700" numberOfLines={1}>
          {entry.food.name}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {qtyText}
        </Txt>
      </View>

      <Row gap={space.md} align="center">
        <View style={{ alignItems: "flex-end", minWidth: 56 }}>
          <Txt variant="subheading" weight="800">
            {fmtKcal(kcal)}
          </Txt>
          <Txt variant="caption">kcal</Txt>
        </View>
        <Press
          onPress={() => onDelete(entry)}
          haptic="none"
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tomatoTint,
          }}
          accessibilityLabel={`Delete ${entry.food.name}`}
        >
          <Feather name="trash-2" size={16} color={colors.tomatoShadow} />
        </Press>
      </Row>
    </Row>
  );
}

// ─── Empty state for a day ──────────────────────────────────────────────────────

function EmptyDay({ isToday, date }: { isToday: boolean; date: string }) {
  return (
    <Card elevation="sm" style={{ paddingVertical: space.xl }}>
      <View style={{ alignItems: "center", gap: space.sm }}>
        <Txt style={{ fontSize: 52 }}>🍽️</Txt>
        <Txt variant="heading" center>
          {isToday ? "Nothing logged yet" : "No food logged"}
        </Txt>
        <Txt variant="body" muted center style={{ maxWidth: 280 }}>
          {isToday
            ? "Start your day off right — log your first meal to see it here."
            : `You didn't log any food on ${formatHeaderDate(date)}.`}
        </Txt>
        <View style={{ marginTop: space.md }}>
          <Button
            title="Log food"
            icon="plus"
            onPress={() => {
              tap();
              router.push("/nourish/log-food");
            }}
          />
        </View>
      </View>
    </Card>
  );
}
