import { Tabs } from "expo-router";
import { Platform } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useEffect } from "react";
import { Feather } from "@expo/vector-icons";
import { colors } from "~/theme";
import { selection as hapticSelection } from "~/lib/haptics";

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  // Active icon springs up a touch when selected — small, satisfying.
  const s = useSharedValue(focused ? 1 : 0.92);
  useEffect(() => {
    s.value = withSpring(focused ? 1 : 0.92, { damping: 10, stiffness: 320 });
  }, [focused]);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View
      style={[
        {
          width: 46,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? colors.basilSoft : "transparent",
        },
        aStyle,
      ]}
    >
      <Feather name={name} size={focused ? 21 : 20} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenListeners={{
        tabPress: () => hapticSelection(),
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.basilShadow,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="ai-chef"
        options={{ title: "AI Chef", tabBarIcon: ({ color, focused }) => <TabIcon name="zap" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="pantry"
        options={{ title: "Pantry", tabBarIcon: ({ color, focused }) => <TabIcon name="archive" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="nourish"
        options={{ title: "Nourish", tabBarIcon: ({ color, focused }) => <TabIcon name="heart" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="grocery"
        options={{ title: "Grocery", tabBarIcon: ({ color, focused }) => <TabIcon name="shopping-cart" color={color} focused={focused} /> }}
      />
    </Tabs>
  );
}
