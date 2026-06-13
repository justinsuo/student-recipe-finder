/**
 * Waivy UI kit — the Pantry Pop design-system primitives, native edition.
 * Big touch targets, rounded cards, 3D buttons, soft shadows, haptics.
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { colors, radius, space, font, shadow, accent, AccentKey, BUTTON_DEPTH } from "~/theme";
import {
  light as hapticLight,
  medium as hapticMedium,
  heavy as hapticHeavy,
  success as hapticSuccess,
  selection as hapticSelection,
} from "~/lib/haptics";

// Springs tuned for a satisfying, Duolingo-ish "pop" on press/release.
const PRESS_SPRING = { damping: 14, stiffness: 320, mass: 0.5 } as const;
const POP_SPRING = { damping: 9, stiffness: 380, mass: 0.5 } as const;

type HapticKind = "none" | "light" | "medium" | "heavy" | "selection" | "success";
function fireHaptic(kind: HapticKind) {
  switch (kind) {
    case "light": return hapticLight();
    case "medium": return hapticMedium();
    case "heavy": return hapticHeavy();
    case "selection": return hapticSelection();
    case "success": return hapticSuccess();
    default: return;
  }
}

type FeatherName = React.ComponentProps<typeof Feather>["name"];

// ─── Text ────────────────────────────────────────────────────────────────────

type TxtVariant =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "label"
  | "caption";

const TXT: Record<TxtVariant, { fontSize: number; fontWeight: any; color: string }> = {
  display: { fontSize: font.sizes.xxxl, fontWeight: "800", color: colors.text },
  title: { fontSize: font.sizes.xxl, fontWeight: "800", color: colors.text },
  heading: { fontSize: font.sizes.lg, fontWeight: "700", color: colors.text },
  subheading: { fontSize: font.sizes.md, fontWeight: "700", color: colors.text },
  body: { fontSize: font.sizes.base, fontWeight: "400", color: colors.text },
  label: { fontSize: font.sizes.sm, fontWeight: "600", color: colors.textMuted },
  caption: { fontSize: font.sizes.xs, fontWeight: "500", color: colors.textFaint },
};

export function Txt({
  variant = "body",
  color,
  weight,
  center,
  muted,
  style,
  children,
  ...rest
}: TextProps & {
  variant?: TxtVariant;
  color?: string;
  weight?: any;
  center?: boolean;
  muted?: boolean;
}) {
  const base = TXT[variant];
  return (
    <Text
      {...rest}
      style={[
        { fontSize: base.fontSize, fontWeight: base.fontWeight, color: base.color },
        muted && { color: colors.textMuted },
        color && { color },
        weight && { fontWeight: weight },
        center && { textAlign: "center" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─── Layout helpers ──────────────────────────────────────────────────────────

export function Row({
  gap = space.sm,
  align = "center",
  justify,
  wrap,
  style,
  children,
  ...rest
}: ViewProps & {
  gap?: number;
  align?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  wrap?: boolean;
}) {
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: "row",
          alignItems: align,
          justifyContent: justify,
          gap,
          flexWrap: wrap ? "wrap" : "nowrap",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Spacer({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

export function Divider({ style }: { style?: any }) {
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({
  style,
  padded = true,
  soft = false,
  elevation = "sm",
  children,
  ...rest
}: ViewProps & {
  padded?: boolean;
  soft?: boolean;
  elevation?: "none" | "sm" | "md" | "lg";
}) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        soft && { backgroundColor: colors.surfaceSoft },
        padded && { padding: space.lg },
        elevation !== "none" && shadow[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Pressable with scale + haptic ───────────────────────────────────────────

export function Press({
  onPress,
  haptic = "light",
  scaleTo = 0.96,
  style,
  children,
  disabled,
  ...rest
}: PressableProps & {
  haptic?: HapticKind;
  scaleTo?: number;
}) {
  const s = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={aStyle}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={() => {
          s.value = withTiming(scaleTo, { duration: 70 });
        }}
        onPressOut={() => {
          // spring back with a touch of overshoot — the "pop".
          s.value = withSpring(1, POP_SPRING);
        }}
        onPress={(e) => {
          fireHaptic(haptic);
          onPress?.(e);
        }}
        style={style}
      >
        {children as any}
      </Pressable>
    </Animated.View>
  );
}

// ─── 3D Button ───────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  accentKey,
  loading,
  disabled,
  full,
  haptic,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: FeatherName;
  accentKey?: AccentKey;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  /** Override the press haptic. Filled CTAs default to "medium", others "light". */
  haptic?: HapticKind;
  style?: any;
}) {
  const depth = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: depth.value }],
  }));

  const acc = accentKey ? accent[accentKey] : null;
  const main =
    variant === "primary" ? colors.basil
      : variant === "danger" ? colors.tomato
      : variant === "accent" && acc ? acc.main
      : colors.surface;
  const shade =
    variant === "primary" ? colors.basilShadow
      : variant === "danger" ? colors.tomatoShadow
      : variant === "accent" && acc ? acc.shadow
      : colors.borderSoft;
  const isFilled = variant === "primary" || variant === "danger" || variant === "accent";
  const fg =
    isFilled ? (variant === "accent" && acc ? acc.on : "#FFFFFF")
      : variant === "ghost" ? colors.basilShadow
      : colors.text;

  const pad =
    size === "sm" ? { paddingVertical: 9, paddingHorizontal: 14 }
      : size === "lg" ? { paddingVertical: 16, paddingHorizontal: 22 }
      : { paddingVertical: 13, paddingHorizontal: 18 };
  const fSize = size === "sm" ? font.sizes.sm : size === "lg" ? font.sizes.md : font.sizes.base;
  const isDisabled = disabled || loading;

  return (
    <View style={[full && { alignSelf: "stretch" }, style]}>
      <View
        style={{
          borderRadius: radius.md,
          backgroundColor: isFilled ? shade : "transparent",
          paddingBottom: isFilled ? BUTTON_DEPTH : 0,
        }}
      >
        <Animated.View style={faceStyle}>
          <Pressable
            disabled={isDisabled}
            onPressIn={() => {
              if (isFilled) depth.value = withTiming(BUTTON_DEPTH, { duration: 60 });
            }}
            onPressOut={() => {
              // pop back up off the 3D shadow with a little bounce.
              depth.value = withSpring(0, PRESS_SPRING);
            }}
            onPress={() => {
              if (isDisabled) return;
              fireHaptic(haptic ?? (isFilled ? "medium" : "light"));
              onPress?.();
            }}
            style={[
              {
                borderRadius: radius.md,
                backgroundColor: main,
                alignItems: "center",
                justifyContent: "center",
                opacity: isDisabled ? 0.6 : 1,
              },
              !isFilled && {
                borderWidth: variant === "ghost" ? 0 : 1.5,
                borderColor: colors.border,
              },
              variant === "ghost" && { backgroundColor: colors.basilSoft },
              pad,
            ]}
          >
            <Row gap={8}>
              {loading ? (
                <ActivityIndicator color={fg} size="small" />
              ) : icon ? (
                <Feather name={icon} size={fSize + 2} color={fg} />
              ) : null}
              <Text style={{ color: fg, fontSize: fSize, fontWeight: "700" }}>{title}</Text>
            </Row>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.text,
  bg = colors.surface,
  size = 42,
  iconSize = 20,
  style,
}: {
  icon: FeatherName;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
  iconSize?: number;
  style?: any;
}) {
  return (
    <Press
      onPress={onPress}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        shadow.sm,
        style,
      ]}
    >
      <Feather name={icon} size={iconSize} color={color} />
    </Press>
  );
}

// ─── Badge / Pill / Chip ─────────────────────────────────────────────────────

export function Badge({
  label,
  tone = "pantry",
  icon,
  solid = false,
}: {
  label: string;
  tone?: AccentKey;
  icon?: FeatherName;
  solid?: boolean;
}) {
  const a = accent[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: solid ? a.main : a.tint,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radius.pill,
      }}
    >
      {icon ? <Feather name={icon} size={12} color={solid ? a.on : a.shadow} /> : null}
      <Text style={{ color: solid ? a.on : a.shadow, fontSize: font.sizes.xs, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}

export function Pill({
  label,
  selected,
  onPress,
  tone = "pantry",
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: AccentKey;
  icon?: FeatherName;
}) {
  const a = accent[tone];
  return (
    <Press
      haptic="selection"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radius.pill,
        backgroundColor: selected ? a.main : colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? a.main : colors.border,
      }}
    >
      {icon ? (
        <Feather name={icon} size={14} color={selected ? a.on : colors.textMuted} />
      ) : null}
      <Text
        style={{
          color: selected ? a.on : colors.text,
          fontWeight: "700",
          fontSize: font.sizes.sm,
        }}
      >
        {label}
      </Text>
    </Press>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Press
            key={o.value}
            haptic="selection"
            scaleTo={0.98}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text
              style={{
                fontWeight: "700",
                fontSize: font.sizes.sm,
                color: active ? colors.text : colors.textMuted,
              }}
            >
              {o.label}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

export function Field({
  label,
  style,
  ...rest
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt variant="label">{label}</Txt> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        {...rest}
        style={[styles.input, style]}
      />
    </View>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function EmptyState({
  emoji,
  title,
  subtitle,
  action,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: space.xxxl, paddingHorizontal: space.xl, gap: 8 }}>
      <Text style={{ fontSize: 52 }}>{emoji}</Text>
      <Txt variant="heading" center>
        {title}
      </Txt>
      {subtitle ? (
        <Txt variant="body" muted center style={{ maxWidth: 300 }}>
          {subtitle}
        </Txt>
      ) : null}
      {action ? <View style={{ marginTop: space.md }}>{action}</View> : null}
    </View>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────

export function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Row justify="space-between" style={{ marginBottom: space.sm }}>
      <Txt variant="heading">{title}</Txt>
      {action ? (
        <Press onPress={onAction} haptic="selection">
          <Text style={{ color: colors.basilShadow, fontWeight: "700", fontSize: font.sizes.sm }}>
            {action}
          </Text>
        </Press>
      ) : null}
    </Row>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.oat,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  segmentItemActive: {
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: font.sizes.md,
    color: colors.text,
  },
});

export { FeatherName };
