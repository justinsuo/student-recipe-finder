/** Screen scaffolds: safe-area aware, cream background, optional header. */
import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, space, font } from "~/theme";
import { Txt, Row, IconButton } from "./ui";

export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Row justify="space-between" align="flex-start" style={{ marginBottom: space.lg }}>
      <Row gap={10} align="center" style={{ flex: 1 }}>
        {back ? (
          <IconButton icon="chevron-left" onPress={() => router.back()} size={40} bg={colors.surface} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Txt variant="title">{title}</Txt>
          {subtitle ? <Txt variant="label" style={{ marginTop: 2 }}>{subtitle}</Txt> : null}
        </View>
      </Row>
      {right}
    </Row>
  );
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: any;
}) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: insets.top + space.md,
    paddingBottom: insets.bottom + 96, // clear the tab bar + FAB
    paddingHorizontal: padded ? space.lg : 0,
  };
  if (!scroll) {
    return <View style={[styles.bg, pad, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.basil} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
});
