import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppState } from "../src/app-state";
import { Button } from "../src/components/Button";
import { Text } from "../src/components/Text";
import { type ThemeColors, useTheme } from "../src/theme";

/**
 * App entry screen, mirroring the PWA welcome page (src/app/(stories)/learn/
 * welcome.tsx on the web): Sign in / Register / Continue anonymously.
 * Unlike the web, the choice is remembered across launches.
 */
export default function Welcome() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { courseShort } = useAppState();

  function continueAnonymously() {
    router.push(`/disclaimer?action=anonymous&next=${courseShort ? "tabs" : "onboarding"}`);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Image
          source={require("../assets/duostories-logo.png")}
          style={styles.logo}
        />
        <Text style={styles.kicker}>Learn with stories</Text>
        <Text style={styles.title}>Welcome to Duostories</Text>
        <Text style={styles.subtitle}>
          Sign in to keep your reading progress, or continue anonymously and
          start learning right away.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Sign in"
            onPress={() => router.push("/disclaimer?action=signin")}
          />
          <Button
            title="Register"
            onPress={() => router.push("/disclaimer?action=register")}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Continue anonymously"
          variant="secondary"
          onPress={continueAnonymously}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 0,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 20,
  },
  kicker: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.blue,
  },
  title: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    marginTop: 10,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 17,
    lineHeight: 26,
    color: colors.textDim,
    marginTop: 14,
    marginBottom: 30,
  },
  actions: {
    gap: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.textDim,
  },
  });
}
