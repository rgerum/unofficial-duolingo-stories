import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAppState } from "../src/app-state";
import { useTheme } from "../src/theme";

/**
 * Boot gate: Welcome on first launch, otherwise straight into the app —
 * the mobile equivalent of the PWA's /learn start URL behavior.
 */
export default function Index() {
  const { colors } = useTheme();
  const { ready, hasSeenWelcome, hasAcceptedDisclaimer, courseShort } =
    useAppState();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (!hasSeenWelcome) return <Redirect href="/welcome" />;
  if (!hasAcceptedDisclaimer) return <Redirect href="/disclaimer" />;
  if (!courseShort) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
