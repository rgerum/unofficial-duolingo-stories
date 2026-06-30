import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../src/api";
import { useAuthSession } from "../src/auth-client";
import { useAppState } from "../src/app-state";
import { CoursePicker } from "../src/components/CoursePicker";
import { Text } from "../src/components/Text";
import { colors } from "../src/theme";

export default function Onboarding() {
  const router = useRouter();
  const { setCourseShort, setHasSeenWelcome } = useAppState();
  const { data: session, isPending: isSessionPending } = useAuthSession();
  const serverProgress = useQuery(
    api.storyDone.getCurrentUserProgress,
    session?.session ? {} : "skip",
  );

  React.useEffect(() => {
    const lastProgressCourse = serverProgress?.[0]?.courseShort;
    if (!lastProgressCourse) return;

    void Promise.all([
      setCourseShort(lastProgressCourse),
      setHasSeenWelcome(true),
    ]).then(() => {
      router.replace("/(tabs)");
    });
  }, [router, serverProgress, setCourseShort, setHasSeenWelcome]);

  const isLoadingAccountProgress =
    isSessionPending || (session?.session && serverProgress === undefined);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick a course</Text>
        <Text style={styles.subtitle}>
          Choose the language you want to read stories in. You can switch any
          time.
        </Text>
      </View>
      {isLoadingAccountProgress ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.blue} />
        </View>
      ) : (
        <CoursePicker
          onSelect={async (course) => {
            await Promise.all([
              setCourseShort(course.short),
              setHasSeenWelcome(true),
            ]);
            router.replace("/(tabs)");
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textDim,
    marginTop: 6,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
