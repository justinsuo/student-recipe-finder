import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { bootstrap } from "~/lib/bootstrap";
import { ToastHost } from "~/components/Toast";
import { CelebrationHost } from "~/components/Celebration";
import { ScreenshotDriver } from "~/components/ScreenshotDriver";
import { colors } from "~/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrap().finally(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.basil} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="recipe/[id]" />
          <Stack.Screen name="cook/[id]" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="chat" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="recipes/index" />
          <Stack.Screen name="cheap" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="settings" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="studio/index" />
          <Stack.Screen name="studio/new" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="nourish/log-food" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="nourish/diary" />
          <Stack.Screen name="nourish/goals" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="nourish/progress" />
        </Stack>
        <ToastHost />
        <CelebrationHost />
        <ScreenshotDriver />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
