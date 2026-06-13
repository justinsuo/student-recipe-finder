import { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import * as Speech from "expo-speech";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Txt, Row, Button, Press, IconButton, EmptyState } from "~/components/ui";
import { toast } from "~/components/Toast";
import { celebrate } from "~/components/Celebration";
import { recordActivity } from "~/lib/streak";
import { colors, space, radius, accent } from "~/theme";
import { getSeedRecipe, getCustom, getAnyView } from "~/lib/recipes";
import { logRecipeAsMeal } from "~/lib/actions";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { success as hapticSuccess, tap } from "~/lib/haptics";
import type { NutritionEstimate } from "@/lib/types";

interface Step { title?: string; instruction: string; timerMinutes?: number }

function getSteps(id: string): { name: string; steps: Step[]; nutrition: NutritionEstimate } | null {
  const seed = getSeedRecipe(id);
  if (seed) {
    let steps: Step[];
    if (seed.guidedCookingSteps?.length) steps = seed.guidedCookingSteps.map((s) => ({ title: s.title, instruction: s.instruction, timerMinutes: s.timerMinutes ?? undefined }));
    else if (seed.detailedSteps?.length) steps = seed.detailedSteps.map((s) => ({ title: s.shortStep, instruction: s.detailedExplanation, timerMinutes: s.timerMinutes ?? undefined }));
    else steps = seed.steps.map((s) => ({ instruction: s }));
    return { name: seed.name, steps, nutrition: bestEffortNutrition(seed).estimate };
  }
  const custom = getCustom(id);
  if (custom) {
    const steps: Step[] = custom.guidedCookingSteps?.length
      ? custom.guidedCookingSteps.map((s) => ({ title: s.title, instruction: s.instruction, timerMinutes: s.timerMinutes ?? undefined }))
      : custom.steps.map((s) => ({ instruction: s }));
    const n = custom.estimatedNutrition;
    return { name: custom.name, steps, nutrition: n ? { calories: n.calories, protein: n.protein, carbs: n.carbs, fat: n.fat, fiber: n.fiber } : { calories: 0, protein: 0, carbs: 0, fat: 0 } };
  }
  return null;
}

export default function GuidedCookScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = decodeURIComponent(String(id));
  const data = useMemo(() => getSteps(recipeId), [recipeId]);

  const [i, setI] = useState(0);
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = data?.steps[i];
  const total = data?.steps.length ?? 0;
  const isLast = i === total - 1;

  useEffect(() => {
    setSecsLeft(step?.timerMinutes ? step.timerMinutes * 60 : null);
    setRunning(false);
  }, [i]);

  useEffect(() => {
    if (running && secsLeft != null && secsLeft > 0) {
      timer.current = setInterval(() => setSecsLeft((s) => (s == null ? null : s - 1)), 1000);
      return () => { if (timer.current) clearInterval(timer.current); };
    }
    if (secsLeft === 0 && running) {
      setRunning(false);
      hapticSuccess();
      toast("⏰ Timer done!", "reward");
      Speech.speak("Timer finished");
    }
  }, [running, secsLeft]);

  if (!data || !step) {
    return <View style={styles.bg}><EmptyState emoji="🍳" title="Nothing to cook" subtitle="This recipe has no steps." action={<Button title="Back" onPress={() => router.back()} />} /></View>;
  }

  async function startTimer() {
    setRunning(true);
    tap();
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted) await Notifications.requestPermissionsAsync();
      if (step?.timerMinutes) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `${data!.name}`, body: `Step ${i + 1} timer is done ⏰`, sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: (secsLeft ?? step.timerMinutes * 60) || 1 },
        });
      }
    } catch {
      // notifications optional
    }
  }

  const mm = secsLeft != null ? String(Math.floor(secsLeft / 60)).padStart(2, "0") : "00";
  const ss = secsLeft != null ? String(secsLeft % 60).padStart(2, "0") : "00";

  return (
    <View style={[styles.bg, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top bar */}
      <Row justify="space-between" style={{ paddingHorizontal: space.lg, paddingVertical: space.md }}>
        <IconButton icon="x" onPress={() => { Speech.stop(); router.back(); }} bg={colors.surface} />
        <View style={{ flex: 1, paddingHorizontal: space.lg }}>
          <Row gap={5} justify="center">
            {data.steps.map((_, idx) => (
              <View key={idx} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: idx <= i ? colors.basil : colors.borderSoft }} />
            ))}
          </Row>
          <Txt variant="caption" muted center style={{ marginTop: 6 }}>Step {i + 1} of {total}</Txt>
        </View>
        <IconButton icon="volume-2" onPress={() => { tap(); Speech.stop(); Speech.speak(step.instruction); }} bg={colors.surface} />
      </Row>

      {/* Step card */}
      <Animated.View key={i} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1, paddingHorizontal: space.lg, justifyContent: "center" }}>
        {step.title ? <Txt variant="label" color={colors.basilShadow} style={{ marginBottom: 10 }}>{step.title.toUpperCase()}</Txt> : null}
        <Txt style={{ fontSize: 26, fontWeight: "700", color: colors.text, lineHeight: 36 }}>{step.instruction}</Txt>

        {step.timerMinutes ? (
          <View style={{ marginTop: space.xxl, alignItems: "center", gap: 14 }}>
            <View style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 8, borderColor: running ? colors.basil : colors.borderSoft, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
              <Txt style={{ fontSize: 48, fontWeight: "800", color: colors.text }}>{mm}:{ss}</Txt>
              <Txt variant="caption" muted>{running ? "cooking…" : "timer"}</Txt>
            </View>
            <Row gap={10}>
              {!running ? (
                <Button title={secsLeft && secsLeft > 0 ? "Start timer" : "Restart"} icon="play" accentKey="pantry" variant="accent"
                  onPress={() => { if (!secsLeft) setSecsLeft(step.timerMinutes! * 60); startTimer(); }} />
              ) : (
                <Button title="Pause" icon="pause" variant="secondary" onPress={() => { setRunning(false); tap(); }} />
              )}
            </Row>
          </View>
        ) : null}
      </Animated.View>

      {/* Ask about step */}
      <Press onPress={() => router.push(`/chat?recipe=${encodeURIComponent(recipeId)}&step=${i + 1}`)} haptic="selection"
        style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center", backgroundColor: accent["ai-chef"].tint, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, marginBottom: space.md }}>
        <Feather name="message-circle" size={16} color={accent["ai-chef"].shadow} />
        <Txt variant="caption" weight="700" color={accent["ai-chef"].shadow}>Ask AI Chef about this step</Txt>
      </Press>

      {/* Nav */}
      <Row gap={12} style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
        <Button title="Back" icon="arrow-left" variant="secondary" size="lg" style={{ flex: 1 }} disabled={i === 0} onPress={() => { Speech.stop(); setI((v) => Math.max(0, v - 1)); }} />
        {isLast ? (
          <Button title="Done 🎉" icon="check" accentKey="pantry" variant="accent" size="lg" style={{ flex: 2 }}
            onPress={() => {
              Speech.stop();
              const c = logRecipeAsMeal(data.name, data.nutrition, recipeId, { silent: true });
              const st = recordActivity();
              celebrate(st.increased && st.count > 1 ? `${st.count}-day streak! 🔥` : "Nice work! 🎉");
              toast(`Logged ${c} cal`, "reward");
              router.back();
            }} />
        ) : (
          <Button title="Next step" icon="arrow-right" accentKey="ai-chef" variant="accent" size="lg" style={{ flex: 2 }} onPress={() => { Speech.stop(); setI((v) => Math.min(total - 1, v + 1)); }} />
        )}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({ bg: { flex: 1, backgroundColor: colors.bg } });
