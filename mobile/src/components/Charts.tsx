/** SVG charts: calorie ring, macro bars, weekly bar chart. */
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { colors, radius, font } from "~/theme";
import { Txt, Row } from "./ui";

export function ProgressRing({
  size = 132,
  stroke = 13,
  progress,
  color = colors.carrot,
  track = colors.oat,
  children,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, isFinite(progress) ? progress : 0));
  const offset = c * (1 - clamped);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: "center" }}>{children}</View>
    </View>
  );
}

export function MacroBar({
  label,
  value,
  target,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const pct = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <Row justify="space-between">
        <Txt variant="label" style={{ color: colors.textMuted }}>{label}</Txt>
        <Txt variant="caption" color={colors.textMuted}>
          {Math.round(value)}/{Math.round(target)}{unit}
        </Txt>
      </Row>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.oat, overflow: "hidden" }}>
        <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

export function WeeklyBars({
  data,
  target,
  height = 120,
  color = colors.basil,
}: {
  data: { label: string; value: number }[];
  target?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(target ?? 0, ...data.map((d) => d.value), 1);
  return (
    <View>
      <Row gap={8} align="flex-end" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(3, (d.value / max) * (height - 24));
          return (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 5 }}>
              <View
                style={{
                  width: "70%",
                  height: h,
                  backgroundColor: d.value > 0 ? color : colors.oat,
                  borderRadius: 6,
                }}
              />
              <Txt variant="caption" color={colors.textFaint} style={{ fontSize: 10 }}>{d.label}</Txt>
            </View>
          );
        })}
      </Row>
    </View>
  );
}
