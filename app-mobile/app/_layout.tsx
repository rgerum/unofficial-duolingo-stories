import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { captureMobileEventLater } from "../src/analytics";
import { AppStateProvider } from "../src/app-state";
import { useConvexBetterAuth } from "../src/auth-client";
import { NetworkStatusProvider } from "../src/network";
import {
  NUNITO_BOLD_FONT_FAMILY,
  NUNITO_FONT_FAMILY,
  NUNITO_LIGHT_FONT_FAMILY,
} from "../src/components/Text";
import { configureAudioSession } from "../src/story/audio";
import { SITELEN_PONA_FONT_FAMILY } from "../src/story/languageStyles";

const nunitoFont = require("../assets/fonts/Nunito-Regular.ttf");
const nunitoBoldFont = require("../assets/fonts/Nunito-Bold.ttf");
const nunitoLightFont = require("../assets/fonts/Nunito-Light.ttf");
const sitelenPonaFont = require("../assets/fonts/linjalipamanka-normal.otf");

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL ??
    "https://compassionate-chinchilla-392.convex.cloud",
  { unsavedChangesWarning: false },
);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [NUNITO_FONT_FAMILY]: nunitoFont,
    [NUNITO_BOLD_FONT_FAMILY]: nunitoBoldFont,
    [NUNITO_LIGHT_FONT_FAMILY]: nunitoLightFont,
    [SITELEN_PONA_FONT_FAMILY]: sitelenPonaFont,
  });

  React.useEffect(() => {
    void configureAudioSession();
    captureMobileEventLater("mobile_app_opened");
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexBetterAuth}>
      <AppStateProvider>
        <NetworkStatusProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" options={{ animation: "fade" }} />
            <Stack.Screen name="auth" options={{ presentation: "modal" }} />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="add-course" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="story/[id]"
              options={{
                presentation: "fullScreenModal",
                gestureEnabled: false,
              }}
            />
          </Stack>
        </NetworkStatusProvider>
      </AppStateProvider>
    </ConvexProviderWithAuth>
  );
}
