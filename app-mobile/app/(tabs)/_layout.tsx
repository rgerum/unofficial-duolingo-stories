import React from "react";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { NUNITO_BOLD_FONT_FAMILY } from "../../src/components/Text";
import { useTheme } from "../../src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  const iosMajorVersion =
    Platform.OS === "ios"
      ? Number.parseInt(String(Platform.Version), 10)
      : undefined;
  const usesLiquidGlassTabs =
    Platform.OS === "ios" && (iosMajorVersion ?? 0) >= 26;
  const tabBarBackgroundColor = usesLiquidGlassTabs
    ? undefined
    : colors.background;
  const glassAdaptiveColor =
    Platform.OS === "ios"
      ? DynamicColorIOS({
          light: "#111827",
          dark: "#ffffff",
        })
      : colors.blue;

  return (
    <NativeTabs
      backgroundColor={tabBarBackgroundColor}
      blurEffect={usesLiquidGlassTabs ? "systemDefault" : "none"}
      disableTransparentOnScrollEdge={
        Platform.OS === "ios" && !usesLiquidGlassTabs ? true : undefined
      }
      iconColor={{
        default: colors.disabled,
        selected: glassAdaptiveColor,
      }}
      indicatorColor={colors.blueLight}
      labelStyle={{
        default: {
          color: colors.disabled,
          fontFamily: NUNITO_BOLD_FONT_FAMILY,
          fontWeight: "400",
        },
        selected: {
          color: glassAdaptiveColor,
          fontFamily: NUNITO_BOLD_FONT_FAMILY,
          fontWeight: "400",
        },
      }}
      minimizeBehavior={usesLiquidGlassTabs ? "automatic" : undefined}
      shadowColor={Platform.OS === "ios" ? "transparent" : colors.border}
      tintColor={glassAdaptiveColor}
    >
      <NativeTabs.Trigger
        name="index"
        contentStyle={{ backgroundColor: colors.background }}
      >
        <NativeTabs.Trigger.Icon
          md="book"
          sf={{ default: "book", selected: "book.fill" }}
        />
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="courses"
        contentStyle={{ backgroundColor: colors.background }}
      >
        <NativeTabs.Trigger.Icon
          md="globe"
          sf={{ default: "globe", selected: "globe" }}
        />
        <NativeTabs.Trigger.Label>Courses</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="profile"
        contentStyle={{ backgroundColor: colors.background }}
      >
        <NativeTabs.Trigger.Icon
          md="account_circle"
          sf={{ default: "person.circle", selected: "person.circle.fill" }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
