import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppState } from "../src/app-state";
import { Button } from "../src/components/Button";
import { colors } from "../src/theme";

type DisclaimerAction = "anonymous" | "signin" | "register";

function getNextRoute({
  action,
  next,
  courseShort,
}: {
  action?: string;
  next?: string;
  courseShort: string | null;
}) {
  if (action === "signin") return "/auth?mode=signin";
  if (action === "register") return "/auth?mode=register";
  if (next === "tabs" || (action === "anonymous" && courseShort)) {
    return "/(tabs)";
  }
  return "/onboarding";
}

export default function DisclaimerScreen() {
  const router = useRouter();
  const { action, next } = useLocalSearchParams<{
    action?: DisclaimerAction;
    next?: string;
  }>();
  const { courseShort, setHasSeenWelcome, setHasAcceptedDisclaimer } =
    useAppState();

  async function accept() {
    await Promise.all([setHasSeenWelcome(true), setHasAcceptedDisclaimer(true)]);
    router.dismissAll();
    router.replace(getNextRoute({ action, next, courseShort }));
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.kicker}>License notice</Text>
        <Text style={styles.title}>Before you continue</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            These stories are owned by Duolingo, Inc. and are used under license
            from Duolingo.
          </Text>
          <Text style={styles.noticeText}>
            Duolingo is not responsible for the translation of these stories and
            this is not an official product of Duolingo.
          </Text>
          <Text style={styles.noticeText}>
            Any further use of these stories requires a license from Duolingo.
          </Text>
        </View>
        <Button title="I understand" onPress={() => void accept()} />
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
    paddingHorizontal: 28,
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
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginTop: 10,
    marginBottom: 24,
  },
  notice: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    padding: 18,
    marginBottom: 22,
    gap: 14,
  },
  noticeText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
