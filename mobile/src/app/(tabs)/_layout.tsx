import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, shadow } from "~/theme";

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 46,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? colors.basilSoft : "transparent",
      }}
    >
      <Feather name={name} size={focused ? 21 : 20} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
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
