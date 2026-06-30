import React from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../src/api";
import { captureMobileEventLater } from "../../src/analytics";
import { useAuthSession } from "../../src/auth-client";
import { useAppState } from "../../src/app-state";
import { useNetworkStatus } from "../../src/network";
import { Button } from "../../src/components/Button";
import { Flag } from "../../src/components/Flag";
import { OfflineNotice } from "../../src/components/OfflineNotice";
import { Text } from "../../src/components/Text";
import {
  clearDoneMap,
  getAllCourseProgress,
  type CourseProgress,
} from "../../src/storage";
import { type ThemeColors, useTheme } from "../../src/theme";

type LandingData = FunctionReturnType<typeof api.landing.getPublicLandingPageData>;
type LandingGroup = LandingData["groups"][number];
type CourseItem = LandingGroup["courses"][number] & {
  fromLanguageName: string;
};

export default function CoursesTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { courseShort, activeCourseShorts, removeCourseShort, setCourseShort } =
    useAppState();
  const { data: session } = useAuthSession();
  const { isOffline } = useNetworkStatus();
  const landingData = useQuery(api.landing.getPublicLandingPageData);
  const deleteCourseProgress = useMutation(
    api.storyDone.deleteCurrentUserCourseProgress,
  );
  const serverProgress = useQuery(
    api.storyDone.getCurrentUserProgress,
    session?.session ? {} : "skip",
  );
  const [localProgress, setLocalProgress] = React.useState<
    Record<string, CourseProgress>
  >({});
  const [actionCourse, setActionCourse] = React.useState<CourseItem | null>(
    null,
  );

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      void getAllCourseProgress().then((progress) => {
        if (!cancelled) setLocalProgress(progress);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const progressByShort = React.useMemo(() => {
    const map = session?.session ? {} : { ...localProgress };
    for (const entry of serverProgress ?? []) {
      map[entry.courseShort] = {
        completedCount: entry.completedCount,
        lastCompletedAt: entry.lastCompletedAt,
      };
    }
    return map;
  }, [localProgress, serverProgress, session?.session]);

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
      )
      .sort((a, b) => {
        if (a.short === courseShort) return -1;
        if (b.short === courseShort) return 1;

        const aLastCompleted = progressByShort[a.short]?.lastCompletedAt ?? 0;
        const bLastCompleted = progressByShort[b.short]?.lastCompletedAt ?? 0;
        if (aLastCompleted !== bLastCompleted) {
          return bLastCompleted - aLastCompleted;
        }

        return a.name.localeCompare(b.name);
      });
  }, [activeShorts, courseShort, landingData, progressByShort]);

  const removeLocalProgress = React.useCallback((short: string) => {
    setLocalProgress((current) => {
      const next = { ...current };
      delete next[short];
      return next;
    });
  }, []);

  const clearCourseProgress = React.useCallback(
    async (course: CourseItem) => {
      if (session?.session) {
        await deleteCourseProgress({ courseShort: course.short });
      } else {
        await clearDoneMap(course.short);
        removeLocalProgress(course.short);
      }
    },
    [deleteCourseProgress, removeLocalProgress, session?.session],
  );

  const removeCourse = React.useCallback(
    async (course: CourseItem) => {
      await removeCourseShort(course.short);
    },
    [removeCourseShort],
  );

  const confirmDeleteCourseProgress = React.useCallback(
    (course: CourseItem) => {
      if (session?.session && isOffline) {
        Alert.alert(
          "You're offline",
          "Connect to the internet to delete progress for this course.",
        );
        return;
      }

      Alert.alert(
        `Delete progress for ${course.name}?`,
        "This removes completed story progress for this course. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              void clearCourseProgress(course).catch((error) => {
                Alert.alert(
                  "Could not delete progress",
                  (error as Error)?.message ??
                    "Check your connection and try again.",
                );
              });
            },
          },
        ],
      );
    },
    [clearCourseProgress, isOffline, session?.session],
  );

  const openCourseActions = React.useCallback(
    (course: CourseItem) => {
      const completed = progressByShort[course.short]?.completedCount ?? 0;
      const canDeleteProgress = completed > 0;
      const canRemoveCourse = completed === 0;

      if (Platform.OS === "ios") {
        const options = [
          ...(canDeleteProgress ? ["Delete progress"] : []),
          ...(canRemoveCourse ? ["Remove course"] : []),
          "Cancel",
        ];
        const destructiveButtonIndex = canDeleteProgress ? 0 : undefined;
        const removeButtonIndex = canDeleteProgress ? 1 : 0;
        const cancelButtonIndex = options.length - 1;

        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex,
            destructiveButtonIndex,
            title: course.name,
          },
          (buttonIndex) => {
            if (canDeleteProgress && buttonIndex === 0) {
              confirmDeleteCourseProgress(course);
            } else if (canRemoveCourse && buttonIndex === removeButtonIndex) {
              void removeCourse(course);
            }
          },
        );
        return;
      }

      setActionCourse(course);
    },
    [confirmDeleteCourseProgress, progressByShort, removeCourse],
  );

  const renderCourse = React.useCallback(
    ({ item: course }: { item: CourseItem }) => {
      const completed = Math.min(
        course.count,
        progressByShort[course.short]?.completedCount ?? 0,
      );
      const selected = course.short === courseShort;
      const canRemoveCourse = completed === 0;

      return (
        <Pressable
          accessibilityRole="button"
          disabled={isOffline}
          onPress={() => {
            captureMobileEventLater("mobile_course_selected", {
              course_short: course.short,
              course_name: course.name,
              from_language: course.fromLanguageName,
            });
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
                {(selected || completed > 0 || canRemoveCourse) && (
                  <View style={styles.cardActions}>
                    {selected && (
                      <Text style={styles.currentBadge}>Current</Text>
                    )}
                    {(completed > 0 || canRemoveCourse) && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Open actions for ${course.name}`}
                        hitSlop={10}
                        onPress={(event) => {
                          event.stopPropagation();
                          openCourseActions(course);
                        }}
                        style={({ pressed }) => [
                          styles.cardActionButton,
                          pressed && { opacity: 0.6 },
                        ]}
                      >
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={22}
                          color={colors.textDim}
                        />
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        course.count > 0
                          ? Math.min(100, (completed / course.count) * 100)
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
    },
    [
      courseShort,
      isOffline,
      openCourseActions,
      progressByShort,
      router,
      setCourseShort,
    ],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Courses</Text>
          <Text style={styles.subtitle}>Your active story courses</Text>
        </View>
        <Button
          title="Add"
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
            title="Add"
            onPress={() => router.push("/add-course")}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(course) => course.short}
          renderItem={renderCourse}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isOffline ? (
              <OfflineNotice detail="Connect to the internet to switch or add courses." />
            ) : null
          }
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          removeClippedSubviews={Platform.OS === "android"}
          updateCellsBatchingPeriod={80}
          windowSize={5}
        />
      )}
      <Modal
        visible={Platform.OS !== "ios" && Boolean(actionCourse)}
        transparent
        animationType="fade"
        onRequestClose={() => setActionCourse(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close course actions"
          style={styles.sheetBackdrop}
          onPress={() => setActionCourse(null)}
        >
          <Pressable
            style={styles.sheet}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>{actionCourse?.name}</Text>
            {(actionCourse
              ? (progressByShort[actionCourse.short]?.completedCount ?? 0) > 0
              : false) && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const course = actionCourse;
                  setActionCourse(null);
                  if (course) confirmDeleteCourseProgress(course);
                }}
                style={({ pressed }) => [
                  styles.sheetAction,
                  pressed && { opacity: 0.65 },
                ]}
              >
                <Ionicons name="trash-outline" size={22} color={colors.red} />
                <Text style={styles.sheetDestructiveText}>Delete progress</Text>
              </Pressable>
            )}
            {(actionCourse
              ? (progressByShort[actionCourse.short]?.completedCount ?? 0) === 0
              : false) && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const course = actionCourse;
                  setActionCourse(null);
                  if (course) void removeCourse(course);
                }}
                style={({ pressed }) => [
                  styles.sheetAction,
                  pressed && { opacity: 0.65 },
                ]}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={styles.sheetActionText}>Remove course</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => setActionCourse(null)}
              style={({ pressed }) => [
                styles.sheetCancel,
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    backgroundColor: colors.surface,
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
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  sheetAction: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
  },
  sheetDestructiveText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.red,
  },
  sheetActionText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sheetCancel: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
  },
  sheetCancelText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  });
}
