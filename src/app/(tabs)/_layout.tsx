import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useGestureUiStore } from "@/stores/gesture-ui-store";
import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";
import { startTransition, useEffect, useRef, useState } from "react";
import { ActivityIndicator, InteractionManager, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { Navigator } = createMaterialTopTabNavigator();
const MaterialBottomTabs = withLayoutContext(Navigator);
const PRIMARY_TAB_WARMUP_PRELOADERS = [
  () => import("./timetable"),
  () => import("./mess"),
];
const SECONDARY_TAB_WARMUP_PRELOADERS = [
  () => import("./faculty"),
  () => import("./attendance"),
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const hasDashboardHydrated = useDashboardStore((state) => state.hasHydrated);
  const isDashboardLoading = useDashboardStore((state) => state.isLoading);
  const isHorizontalContentGestureActive = useGestureUiStore(
    (state) => state.isHorizontalContentGestureActive,
  );
  const [lazyEnabled, setLazyEnabled] = useState(true);
  const [lazyPreloadDistance, setLazyPreloadDistance] = useState(0);
  const hasScheduledTabWarmup = useRef(false);
  const insets = useSafeAreaInsets();
  const tabLabelStyle = { fontSize: 12, lineHeight: 16 };
  const iconSize = 22;
  const tabBarContentHeight = iconSize + tabLabelStyle.lineHeight + 8;
  const tabBarHeight = tabBarContentHeight + insets.bottom;

  useEffect(() => {
    if (!hasDashboardHydrated || isDashboardLoading) return;
    if (hasScheduledTabWarmup.current) return;
    hasScheduledTabWarmup.current = true;

    let primaryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let secondaryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let fullMountTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let secondaryTask: ReturnType<
      typeof InteractionManager.runAfterInteractions
    > | null = null;
    let fullMountTask: ReturnType<
      typeof InteractionManager.runAfterInteractions
    > | null = null;

    const primaryTask = InteractionManager.runAfterInteractions(() => {
      primaryTimeoutId = setTimeout(() => {
        setLazyPreloadDistance(1);
        void Promise.allSettled(
          PRIMARY_TAB_WARMUP_PRELOADERS.map((preloadRoute) => preloadRoute()),
        );

        secondaryTask = InteractionManager.runAfterInteractions(() => {
          secondaryTimeoutId = setTimeout(() => {
            setLazyPreloadDistance(2);
            void Promise.allSettled(
              SECONDARY_TAB_WARMUP_PRELOADERS.map((preloadRoute) =>
                preloadRoute(),
              ),
            );
          }, 300);
        });

        fullMountTask = InteractionManager.runAfterInteractions(() => {
          fullMountTimeoutId = setTimeout(() => {
            startTransition(() => {
              setLazyPreloadDistance(4);
              setLazyEnabled(false);
            });
          }, 900);
        });
      }, 450);
    });

    return () => {
      primaryTask.cancel();
      secondaryTask?.cancel();
      fullMountTask?.cancel();
      if (primaryTimeoutId) {
        clearTimeout(primaryTimeoutId);
      }
      if (secondaryTimeoutId) {
        clearTimeout(secondaryTimeoutId);
      }
      if (fullMountTimeoutId) {
        clearTimeout(fullMountTimeoutId);
      }
    };
  }, [hasDashboardHydrated, isDashboardLoading]);

  return (
    <MaterialBottomTabs
      initialRouteName="index"
      backBehavior="initialRoute"
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        lazy: lazyEnabled,
        lazyPreloadDistance,
        sceneStyle: { backgroundColor: theme.background },
        lazyPlaceholder: () => (
          <View
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: theme.background }}
          >
            <ActivityIndicator size="small" color={theme.textSecondary} />
          </View>
        ),
        tabBarAllowFontScaling: false,
        tabBarLabel: ({ color, children }) => (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[tabLabelStyle, { color }]}
          >
            {children}
          </Text>
        ),
        tabBarItemStyle: { paddingVertical: 0, height: tabBarContentHeight },
        tabBarShowIcon: true,
        tabBarIndicatorStyle: { height: 0 },
        tabBarStyle: {
          backgroundColor: isDark ? Colors.black : Colors.white,
          borderTopColor: theme.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 2,
        },
        swipeEnabled: !isHorizontalContentGestureActive,
      }}
    >
      {/* left side: faculty, timetable */}
      <MaterialBottomTabs.Screen
        name="faculty"
        options={{
          title: "Faculty",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="people-outline" size={iconSize} color={color} />
          ),
        }}
      />
      <MaterialBottomTabs.Screen
        name="timetable"
        options={{
          title: "Timetable",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="time-outline" size={iconSize} color={color} />
          ),
        }}
      />

      {/* center: dashboard */}
      <MaterialBottomTabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="grid-outline" size={iconSize} color={color} />
          ),
        }}
      />

      {/* right side: mess, attendance */}
      <MaterialBottomTabs.Screen
        name="mess"
        options={{
          title: "Mess",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="restaurant-outline" size={iconSize} color={color} />
          ),
        }}
      />
      <MaterialBottomTabs.Screen
        name="attendance"
        options={{
          title: "Bunks",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="calendar-outline" size={iconSize} color={color} />
          ),
        }}
      />
    </MaterialBottomTabs>
  );
}
