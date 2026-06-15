import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { AppStateProvider } from "../src/app-state";
import { useConvexBetterAuth } from "../src/auth-client";
import { configureAudioSession } from "../src/story/audio";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://compassionate-chinchilla-392.convex.cloud",
  { unsavedChangesWarning: false },
);

export default function RootLayout() {
  React.useEffect(() => {
    void configureAudioSession();
  }, []);

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexBetterAuth}>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" options={{ animation: "fade" }} />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="story/[id]"
            options={{ presentation: "fullScreenModal", gestureEnabled: false }}
          />
        </Stack>
      </AppStateProvider>
    </ConvexProviderWithAuth>
  );
}
