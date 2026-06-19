import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../src/api";
import { useAuthSession } from "../../src/auth-client";
import { useAppState } from "../../src/app-state";
import { useNetworkStatus } from "../../src/network";
import { Button } from "../../src/components/Button";
import { Flag } from "../../src/components/Flag";
import { OfflineNotice } from "../../src/components/OfflineNotice";
import { Text } from "../../src/components/Text";
import { getAllProgress } from "../../src/storage";
import { colors } from "../../src/theme";

type LandingData = FunctionReturnType<typeof api.landing.getPublicLandingPageData>;
type LandingGroup = LandingData["groups"][number];
type CourseItem = LandingGroup["courses"][number] & {
  fromLanguageName: string;
};

export default function CoursesTab() {
  const router = useRouter();
  const { courseShort, activeCourseShorts, setCourseShort } = useAppState();
  const { data: session } = useAuthSession();
  const { isOffline } = useNetworkStatus();
  const landingData = useQuery(api.landing.getPublicLandingPageData);
  const serverProgress = useQuery(
    api.storyDone.getCurrentUserProgress,
    session?.session ? {} : "skip",
  );
  const [localProgress, setLocalProgress] = React.useState<
    Record<string, number>
  >({});

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      void getAllProgress().then((progress) => {
        if (!cancelled) setLocalProgress(progress);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const progressByShort = React.useMemo(() => {
    const map = { ...localProgress };
    for (const entry of serverProgress ?? []) {
      map[entry.courseShort] = entry.completedCount;
    }
    return map;
  }, [localProgress, serverProgress]);

  const activeShorts = React.useMemo(() => {
    const shorts = new Set(activeCourseShorts);
    if (courseShort) shorts.add(courseShort);
    for (const short of Object.keys(progressByShort)) shorts.add(short);
    return Array.from(shorts);
  }, [activeCourseShorts, courseShort, progressByShort]);

  const courses = React.useMemo(() => {
    if (!landingData) return undefined;
    const byShort = new Map<string, CourseItem>();
    for (const group of landingData.groups) {
      for (const course of group.courses) {
        byShort.set(course.short, {
          ...course,
          fromLanguageName: group.fromLanguageName,
        });
      }
    }
    return activeShorts
      .map((short) => byShort.get(short))
      .filter((course): course is NonNullable<typeof course> =>
        Boolean(course),
      );
  }, [activeShorts, landingData]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Courses</Text>
          <Text style={styles.subtitle}>Your active story courses</Text>
        </View>
        <Button
          title="Add course"
          disabled={isOffline}
          onPress={() => router.push("/add-course")}
        />
      </View>
      {courses === undefined ? (
        isOffline ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>You're offline</Text>
            <Text style={styles.emptyText}>
              Connect to the internet to load your course list.
            </Text>
          </View>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
          </View>
        )
      ) : courses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No active courses yet</Text>
          <Text style={styles.emptyText}>
            Add a course to start reading stories.
          </Text>
          <Button
            title="Add course"
            onPress={() => router.push("/add-course")}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {isOffline ? (
            <OfflineNotice detail="Connect to the internet to switch or add courses." />
          ) : null}
          {courses.map((course) => {
            const completed = Math.min(
              course.count,
              progressByShort[course.short] ?? 0,
            );
            const selected = course.short === courseShort;
            return (
              <Pressable
                key={course.short}
                accessibilityRole="button"
                disabled={isOffline}
                onPress={() => {
                  void setCourseShort(course.short).then(() =>
                    router.navigate("/(tabs)"),
                  );
                }}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  isOffline && styles.cardDisabled,
                  pressed && !isOffline && { opacity: 0.75 },
                ]}
              >
                <View style={styles.cardContent}>
                  <Flag
                    iso={course.learningLanguage.short}
                    flag={course.learningLanguage.flag}
                    flag_file={course.learningLanguage.flag_file}
                    width={48}
                  />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.courseName}>{course.name}</Text>
                        <Text style={styles.courseMeta}>
                          From {course.fromLanguageName}
                        </Text>
                      </View>
                      {selected && (
                        <Text style={styles.currentBadge}>Current</Text>
                      )}
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              course.count > 0
                                ? Math.min(
                                    100,
                                    (completed / course.count) * 100,
                                  )
                                : 0
                            }%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {completed} / {course.count} stories completed
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textDim,
    marginTop: 2,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textDim,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 18,
    alignSelf: "stretch",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    backgroundColor: colors.background,
  },
  cardSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueLight,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  courseName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  courseMeta: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 2,
  },
  currentBadge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.greenLight,
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  progressText: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 8,
  },
});
