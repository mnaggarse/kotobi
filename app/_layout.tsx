import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Tabs } from "expo-router";
import { I18nManager } from "react-native";

export default function RootLayout() {
  // Force RTL layout
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    "IBMPlexSansArabic-Regular": require("../assets/fonts/IBMPlexSansArabic-Regular.ttf"),
    "IBMPlexSansArabic-SemiBold": require("../assets/fonts/IBMPlexSansArabic-SemiBold.ttf"),
  });

  // Hide the navigation bar
  NavigationBar.setVisibilityAsync("hidden");

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6147E5",
        tabBarInactiveTintColor: "#8A8A8A",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          paddingBottom: 24,
          paddingTop: 8,
          height: 80,
        },
        headerShown: false, // Hide all page headers
        tabBarLabelStyle: {
          fontFamily: "IBMPlexSansArabic-SemiBold",
          fontSize: 13,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "المكتبة",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-book"
        options={{
          title: "إضافة كتاب",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "الملف الشخصي",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
