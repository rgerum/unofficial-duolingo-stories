import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppState } from "../src/app-state";
import { Button } from "../src/components/Button";
import { colors } from "../src/theme";

/**
 * Placeholder for the accounts milestone (M3 in docs/mobile-app-design.md).
 * Better Auth sign-in/OAuth lands here; until then progress is kept on the
 * device and will sync to an account once it exists.
 */
export default function AuthScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { setHasSeenWelcome, courseShort } = useAppState();
  const isRegister = mode === "register";

  function continueWithoutAccount() {
    setHasSeenWelcome(true);
    router.dismissAll();
    router.replace(courseShort ? "/(tabs)" : "/onboarding");
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Ionicons name="construct-outline" size={56} color={colors.blue} />
        <Text style={styles.title}>
          {isRegister ? "Registration" : "Sign in"} is coming soon
        </Text>
        <Text style={styles.body}>
          Accounts arrive in an upcoming update. Until then, your reading
          progress is saved on this device and will sync to your account once
          you sign in.
        </Text>
        <Text style={styles.body}>
          You can already use your account on the web at duostories.org.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Continue without an account"
            onPress={continueWithoutAccount}
          />
          <Button
            title="Open duostories.org"
            variant="secondary"
            onPress={() => void Linking.openURL("https://duostories.org")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginTop: 18,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textDim,
    textAlign: "center",
    marginTop: 14,
  },
  actions: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 30,
  },
});
