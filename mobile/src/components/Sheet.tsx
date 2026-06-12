/**
 * Bottom sheet — a Modal with a slide-up panel, dimmed backdrop, drag handle,
 * and keyboard avoidance. Lightweight (no extra deps) so it stays compatible
 * with the installed Reanimated / RN versions.
 */
import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, space, shadow } from "~/theme";
import { Txt, IconButton, Row } from "./ui";

export function Sheet({
  visible,
  onClose,
  title,
  children,
  scroll = true,
  maxHeightPct = 0.9,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  maxHeightPct?: number;
}) {
  const insets = useSafeAreaInsets();
  const translate = useSharedValue(600);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translate.value = withTiming(0, { duration: 240 });
      backdrop.value = withTiming(1, { duration: 240 });
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  const close = () => {
    translate.value = withTiming(700, { duration: 200 });
    backdrop.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 190);
  };

  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} onPress={close} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.panel,
              { maxHeight: `${maxHeightPct * 100}%`, paddingBottom: insets.bottom + space.lg },
              panelStyle,
            ]}
          >
            <View style={styles.handle} />
            {title ? (
              <Row justify="space-between" style={{ marginBottom: space.md, paddingHorizontal: space.lg }}>
                <Txt variant="heading">{title}</Txt>
                <IconButton icon="x" onPress={close} size={34} iconSize={18} bg={colors.oat} />
              </Row>
            ) : null}
            <Body
              style={{ paddingHorizontal: space.lg }}
              contentContainerStyle={scroll ? { paddingBottom: space.md, gap: space.md } : undefined}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </Body>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  kav: { justifyContent: "flex-end" },
  panel: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: space.sm,
    ...shadow.lg,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderSoft,
    alignSelf: "center",
    marginBottom: space.md,
  },
});
