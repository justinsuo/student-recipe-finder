import { useMemo } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "~/components/Screen";
import { Txt, Row, Card, Press, Badge, IconButton, SectionHeading, EmptyState } from "~/components/ui";
import { ProgressRing, MacroBar } from "~/components/Charts";
import { toast } from "~/components/Toast";
import { colors, space, radius, accent, AccentKey } from "~/theme";
import { useToday, useWater, deleteEntry } from "~/lib/stores/nourish";
import { entryTotals } from "@/lib/nourish/types";
import { tap } from "~/lib/haptics";

const MEALS: { slot: string; label: string; emoji: string }[] = [
  { slot: "breakfast", label: "Breakfast", emoji: "🍳" },
  { slot: "lunch", label: "Lunch", emoji: "🥗" },
  { slot: "dinner", label: "Dinner", emoji: "🍝" },
  { slot: "snack", label: "Snacks", emoji: "🍎" },
];

const QUICK: { label: string; icon: any; tone: AccentKey; href: string }[] = [
  { label: "Log food", icon: "plus-circle", tone: "nourish", href: "/nourish/log-food" },
  { label: "Diary", icon: "book-open", tone: "ai-chef", href: "/nourish/diary" },
  { label: "Goals", icon: "target", tone: "pantry", href: "/nourish/goals" },
  { label: "Progress", icon: "trending-up", tone: "grocery", href: "/nourish/progress" },
];

export default function NourishScreen() {
  const { totals, target, entries, remaining } = useToday();
  const water = useWater();
  const calPct = target.calorieTarget ? totals.kcal / target.calorieTarget : 0;

  const byMeal = useMemo(() => {
    const g: Record<string, typeof entries> = {};
    for (const e of entries) (g[e.meal] ||= []).push(e);
    return g;
  }, [entries]);

  const waterPct = water.entry.goalMl ? water.entry.mlConsumed / water.entry.goalMl : 0;

  return (
    <Screen>
      <Row justify="space-between" style={{ marginBottom: space.lg }}>
        <View><Txt variant="label">NOURISH · TODAY</Txt><Txt variant="title">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</Txt></View>
        <IconButton icon="settings" onPress={() => router.push("/nourish/goals")} />
      </Row>

      {/* Calorie ring + macros */}
      <Card style={{ gap: space.lg }}>
        <Row gap={space.lg} align="center">
          <ProgressRing size={132} stroke={13} progress={calPct} color={colors.carrot}>
            <Txt variant="title">{Math.round(totals.kcal)}</Txt>
            <Txt variant="caption" muted>of {target.calorieTarget}</Txt>
          </ProgressRing>
          <View style={{ flex: 1, gap: 12 }}>
            <View>
              <Txt variant="heading" color={remaining > 0 ? colors.basilShadow : colors.tomato}>{Math.round(remaining)}</Txt>
              <Txt variant="caption" muted>calories {remaining > 0 ? "remaining" : "over"}</Txt>
            </View>
            <MacroBar label="Protein" value={totals.proteinG} target={target.proteinG} color={colors.grape} />
            <MacroBar label="Carbs" value={totals.carbG} target={target.carbG} color={colors.sky} />
            <MacroBar label="Fat" value={totals.fatG} target={target.fatG} color={colors.butter} />
          </View>
        </Row>
      </Card>

      {/* Quick actions */}
      <Row gap={10} style={{ marginVertical: space.lg }} justify="space-between">
        {QUICK.map((q) => {
          const a = accent[q.tone];
          return (
            <Press key={q.label} onPress={() => router.push(q.href as any)} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: a.tint, alignItems: "center", justifyContent: "center" }}>
                <Feather name={q.icon} size={21} color={a.shadow} />
              </View>
              <Txt variant="caption" numberOfLines={1} style={{ fontSize: 11 }}>{q.label}</Txt>
            </Press>
          );
        })}
      </Row>

      {/* Water */}
      <Card style={{ gap: 12 }}>
        <Row justify="space-between">
          <Row gap={8}><Feather name="droplet" size={18} color={colors.sky} /><Txt variant="subheading">Water</Txt></Row>
          <Txt variant="label">{water.entry.mlConsumed} / {water.entry.goalMl} ml</Txt>
        </Row>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.oat, overflow: "hidden" }}>
          <View style={{ width: `${Math.min(100, waterPct * 100)}%`, height: "100%", backgroundColor: colors.sky }} />
        </View>
        <Row gap={8}>
          {[250, 500].map((ml) => (
            <Press key={ml} onPress={() => { water.addMl(ml); tap(); }} style={{ flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radius.md, backgroundColor: colors.skyTint }}>
              <Txt variant="caption" weight="700" color={colors.skyShadow}>+{ml} ml</Txt>
            </Press>
          ))}
          <Press onPress={() => { water.addMl(-250); tap(); }} style={{ width: 44, alignItems: "center", paddingVertical: 9, borderRadius: radius.md, backgroundColor: colors.oat }}>
            <Feather name="minus" size={16} color={colors.textMuted} />
          </Press>
        </Row>
      </Card>

      {/* Diary */}
      <SectionHeading title="Today's diary" action="Full diary" onAction={() => router.push("/nourish/diary")} />
      {entries.length === 0 ? (
        <EmptyState emoji="🍽️" title="Nothing logged yet" subtitle="Log a meal, a food, or a Waivy recipe to track your day."
          action={<Button label="Log food" />} />
      ) : (
        MEALS.filter((m) => byMeal[m.slot]?.length).map((m) => {
          const mealKcal = (byMeal[m.slot] ?? []).reduce((s, e) => s + entryTotals(e).kcal, 0);
          return (
            <Card key={m.slot} style={{ marginBottom: space.md, gap: 6 }}>
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Txt variant="subheading">{m.emoji} {m.label}</Txt>
                <Txt variant="label">{Math.round(mealKcal)} cal</Txt>
              </Row>
              {byMeal[m.slot].map((e) => (
                <Row key={e.id} justify="space-between" style={{ paddingVertical: 5 }}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="body" numberOfLines={1}>{e.food.name}</Txt>
                    <Txt variant="caption" muted>{e.quantityServings} × {e.food.servingDescription}</Txt>
                  </View>
                  <Row gap={10}>
                    <Txt variant="caption" weight="700">{Math.round(entryTotals(e).kcal)}</Txt>
                    <Press onPress={() => { deleteEntry(e.id); tap(); toast("Removed", "info"); }}><Feather name="x" size={16} color={colors.textFaint} /></Press>
                  </Row>
                </Row>
              ))}
            </Card>
          );
        })
      )}

      <Press onPress={() => router.push("/nourish/log-food")} haptic="light"
        style={{ position: "absolute", right: space.lg, bottom: 30, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.carrot, alignItems: "center", justifyContent: "center", shadowColor: colors.carrotShadow, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
        <Feather name="plus" size={26} color="#fff" />
      </Press>
    </Screen>
  );
}

// local helper to avoid importing Button just for one empty-state CTA label
function Button({ label }: { label: string }) {
  return (
    <Press onPress={() => router.push("/nourish/log-food")} style={{ backgroundColor: colors.carrot, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.md }}>
      <Txt weight="700" color="#fff">{label}</Txt>
    </Press>
  );
}
