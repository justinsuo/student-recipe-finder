/** Global toast — call toast("Saved!") from anywhere; <ToastHost/> renders it. */
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, radius, space, shadow, font } from "~/theme";
import { success as hapticSuccess, warning as hapticWarning } from "~/lib/haptics";

export type ToastKind = "success" | "info" | "error" | "reward";

type ToastItem = { id: number; message: string; kind: ToastKind };

let counter = 0;
const subscribers = new Set<(t: ToastItem) => void>();

export function toast(message: string, kind: ToastKind = "success") {
  const item = { id: ++counter, message, kind };
  if (kind === "success" || kind === "reward") hapticSuccess();
  else if (kind === "error") hapticWarning();
  subscribers.forEach((s) => s(item));
}

const ICON: Record<ToastKind, React.ComponentProps<typeof Feather>["name"]> = {
  success: "check-circle",
  info: "info",
  error: "alert-circle",
  reward: "award",
};
const TINT: Record<ToastKind, string> = {
  success: colors.basil,
  info: colors.sky,
  error: colors.tomato,
  reward: colors.grape,
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastItem | null>(null);

  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setCurrent(t);
      setTimeout(() => setCurrent((c) => (c?.id === t.id ? null : c)), 2600);
    };
    subscribers.add(onToast);
    return () => {
      subscribers.delete(onToast);
    };
  }, []);

  if (!current) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 90 }]}>
      <Animated.View entering={FadeInUp.springify()} exiting={FadeOutDown} style={styles.toast}>
        <View style={[styles.dot, { backgroundColor: TINT[current.kind] }]}>
          <Feather name={ICON[current.kind]} size={15} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Animated.Text style={styles.text} numberOfLines={2}>
            {current.message}
          </Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: space.lg, right: space.lg, alignItems: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    maxWidth: 420,
    ...shadow.lg,
  },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "600", fontSize: font.sizes.sm },
});
