import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import Constants from "expo-constants";
import { api } from "../../src/api";
import { useAppState } from "../../src/app-state";
import { clearAllProgress, getAllProgress } from "../../src/storage";
import { Button } from "../../src/components/Button";
import { colors } from "../../src/theme";

export default function ProfileTab() {
  const router = useRouter();
  const { hideStoryQuestions, setHideStoryQuestions } = useAppState();
  const [progress, setProgress] = React.useState<Record<string, number>>({});
  const courseList = useQuery(api.landing.getPublicCourseList);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      void getAllProgress().then((result) => {
        if (!cancelled) setProgress(result);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const courseNameByShort = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const course of courseList ?? []) {
      map[course.short] = `${course.name} (from ${course.from_language_name})`;
    }
    return map;
  }, [courseList]);

  const progressEntries = Object.entries(progress);

  function confirmResetProgress() {
    Alert.alert(
      "Reset progress",
      "This removes all locally saved story progress on this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            void clearAllProgress().then(() => setProgress({}));
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>You're reading anonymously</Text>
          <Text style={styles.cardBody}>
            Your progress is saved on this device. Create an account to keep it
            safe and sync with the web.
          </Text>
          <View style={styles.cardActions}>
            <Button
              title="Sign in"
              onPress={() => router.push("/auth?mode=signin")}
            />
            <Button
              title="Register"
              variant="secondary"
              onPress={() => router.push("/auth?mode=register")}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Story settings</Text>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Hide story questions</Text>
            <Text style={styles.settingHint}>
              Read stories without interactive challenges.
            </Text>
          </View>
          <Switch
            value={hideStoryQuestions}
            onValueChange={setHideStoryQuestions}
            trackColor={{ true: colors.blue }}
          />
        </View>

        <Text style={styles.sectionTitle}>Progress on this device</Text>
        {progressEntries.length === 0 ? (
          <Text style={styles.cardBody}>No stories completed yet.</Text>
        ) : (
          progressEntries.map(([short, count]) => (
            <View key={short} style={styles.progressRow}>
              <Text style={styles.progressCourse}>
                {courseNameByShort[short] ?? short}
              </Text>
              <Text style={styles.progressCount}>
                {count} {count === 1 ? "story" : "stories"}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>About</Text>
        <Button
          title="Open duostories.org"
          variant="secondary"
          onPress={() => void Linking.openURL("https://duostories.org")}
        />
        <View style={{ height: 12 }} />
        <Button
          title="FAQ"
          variant="secondary"
          onPress={() => void Linking.openURL("https://duostories.org/faq")}
        />
        <Text style={styles.version}>
          Duostories {Constants.expoConfig?.version ?? ""} — an unofficial,
          community-built app. Not affiliated with Duolingo.
        </Text>

        <View style={{ height: 12 }} />
        <Button
          title="Reset local progress"
          variant="danger"
          onPress={confirmResetProgress}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.blueLight,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textDim,
    marginTop: 6,
  },
  cardActions: {
    marginTop: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 28,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  settingHint: {
    fontSize: 13,
    color: colors.textDim,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressCourse: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },
  progressCount: {
    fontSize: 15,
    color: colors.textDim,
    marginLeft: 10,
  },
  version: {
    fontSize: 13,
    color: colors.textDim,
    marginTop: 16,
    lineHeight: 19,
  },
});
