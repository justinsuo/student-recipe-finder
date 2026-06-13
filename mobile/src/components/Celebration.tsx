/**
 * Celebration — a Duolingo-style confetti burst + center "pop" badge for big
 * wins (finishing a cook, hitting a macro goal, a streak). Call `celebrate()`
 * from anywhere; <CelebrationHost/> (mounted once near ToastHost) renders it.
 * No third-party dependency — pure Reanimated.
 */
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, radius, font, shadow } from "~/theme";
import { celebrate as hapticCelebrate } from "~/lib/haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PALETTE = ["#2FBF71", "#FFC83D", "#EF4444", "#8B5CF6", "#38BDF8", "#FB923C", "#EC4899", "#22D3EE"];
const PIECES = 28;

type Burst = { id: number; message?: string };

let counter = 0;
const subscribers = new Set<(b: Burst) => void>();

/** Fire a confetti celebration (+ celebratory haptic). Optional center message. */
export function celebrate(message?: string) {
  hapticCelebrate();
  const b = { id: ++counter, message };
  subscribers.forEach((s) => s(b));
}

function ConfettiPiece({ index, seed }: { index: number; seed: number }) {
  // deterministic-ish pseudo-random from index+seed (no Math.random in render)
  const r = (n: number) => {
    const x = Math.sin((index + 1) * 12.9898 + seed * 78.233 + n * 3.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const startX = SCREEN_W / 2 + (r(1) - 0.5) * 80;
  const startY = SCREEN_H * 0.42;
  const driftX = (r(2) - 0.5) * SCREEN_W * 0.9;
  const fall = SCREEN_H * (0.45 + r(3) * 0.4);
  const rise = -(60 + r(4) * 140);
  const size = 7 + Math.floor(r(5) * 7);
  const color = PALETTE[index % PALETTE.length];
  const round = r(6) > 0.5;
  const duration = 1100 + Math.floor(r(7) * 700);

  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const rot = useSharedValue(0);
  const op = useSharedValue(1);

  useEffect(() => {
    // shoot up, arc, then fall + fade
    ty.value = withSequence(
      withTiming(rise, { duration: 320, easing: Easing.out(Easing.quad) }),
      withTiming(fall, { duration, easing: Easing.in(Easing.quad) }),
    );
    tx.value = withTiming(driftX, { duration: duration + 320, easing: Easing.out(Easing.cubic) });
    rot.value = withTiming((r(8) > 0.5 ? 1 : -1) * (720 + r(9) * 720), {
      duration: duration + 320,
      easing: Easing.linear,
    });
    op.value = withDelay(duration, withTiming(0, { duration: 320 }));
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rot.value}deg` }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: startY,
          width: size,
          height: size * (round ? 1 : 1.6),
          backgroundColor: color,
          borderRadius: round ? size : 2,
        },
        aStyle,
      ]}
    />
  );
}

function Badge({ message }: { message: string }) {
  const scale = useSharedValue(0.4);
  const op = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.08, { damping: 8, stiffness: 320 }),
      withSpring(1, { damping: 12, stiffness: 260 }),
    );
    op.value = withSequence(
      withTiming(1, { duration: 160 }),
      withDelay(1100, withTiming(0, { duration: 320 })),
    );
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: op.value }));
  return (
    <Animated.View style={[styles.badge, aStyle]}>
      <Animated.Text style={styles.badgeText}>{message}</Animated.Text>
    </Animated.View>
  );
}

export function CelebrationHost() {
  const [burst, setBurst] = useState<Burst | null>(null);

  useEffect(() => {
    const onBurst = (b: Burst) => {
      setBurst(b);
      setTimeout(() => setBurst((c) => (c?.id === b.id ? null : c)), 2200);
    };
    subscribers.add(onBurst);
    return () => {
      subscribers.delete(onBurst);
    };
  }, []);

  if (!burst) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PIECES }).map((_, i) => (
        <ConfettiPiece key={`${burst.id}-${i}`} index={i} seed={burst.id} />
      ))}
      {burst.message ? (
        <View style={styles.badgeWrap} pointerEvents="none">
          <Badge key={burst.id} message={burst.message} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    ...shadow.lg,
  },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: font.sizes.lg },
});
