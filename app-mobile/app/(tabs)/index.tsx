import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../src/api";
import { captureMobileEventLater } from "../../src/analytics";
import { useAuthSession } from "../../src/auth-client";
import { useAppState } from "../../src/app-state";
import { useNetworkStatus } from "../../src/network";
import {
  getDoneMap,
  getListeningMode,
  setListeningMode,
  type DoneMap,
} from "../../src/storage";
import { StoryButton, type StoryListItem } from "../../src/components/StoryButton";
import { Button } from "../../src/components/Button";
import { OfflineNotice } from "../../src/components/OfflineNotice";
import { Text } from "../../src/components/Text";
import { type ThemeColors, useTheme } from "../../src/theme";

type StorySet = { setId: number; stories: StoryListItem[] };

/** Learn tab: the current course's stories, grouped by set. */
export default function LearnTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { ready, courseShort } = useAppState();
  const { data: session } = useAuthSession();
  const { isOffline } = useNetworkStatus();

  const course = useQuery(
    api.landing.getPublicCoursePageData,
    courseShort ? { short: courseShort } : "skip",
  );
  const serverDoneIds = useQuery(
    api.storyDone.getDoneStoryIdsForCurrentUserInCourse,
    courseShort ? { courseShort } : "skip",
  );

  const [doneMap, setDoneMap] = React.useState<DoneMap>({});
  const [listening, setListening] = React.useState(false);
  const serverDoneSet = React.useMemo(() => {
    if (!serverDoneIds) return null;
    return new Set(serverDoneIds);
  }, [serverDoneIds]);
  const stories = React.useMemo(
    () => (course && course !== null ? (course.stories as StoryListItem[]) : []),
    [course],
  );
  const isStoryDone = React.useCallback(
    (storyId: number) =>
      session?.session
        ? Boolean(serverDoneSet?.has(storyId))
        : Boolean(doneMap[String(storyId)]),
    [doneMap, serverDoneSet, session?.session],
  );
  const doneCount = React.useMemo(
    () => stories.filter((story) => isStoryDone(story.id)).length,
    [isStoryDone, stories],
  );
  const isServerProgressPending =
    Boolean(session?.session) && serverDoneIds === undefined && !isOffline;
  const sets = React.useMemo(() => {
    const grouped: StorySet[] = [];
    for (const story of stories) {
      const last = grouped[grouped.length - 1];
      if (last && last.setId === story.set_id) last.stories.push(story);
      else grouped.push({ setId: story.set_id, stories: [story] });
    }
    return grouped;
  }, [stories]);
  const renderStorySet = React.useCallback(
    ({ item }: { item: StorySet }) => (
      <View style={styles.set}>
        <Text style={styles.setTitle}>Set {item.setId}</Text>
        <View style={styles.setGrid}>
          {item.stories.map((story) => (
            <StoryButton
              key={story.id}
              story={story}
              done={isStoryDone(story.id)}
              listeningMode={listening}
              disabled={isOffline}
              onPress={() => {
                captureMobileEventLater("story_opened", {
                  story_id: story.id,
                  course_short: courseShort,
                  listening_mode: listening,
                });
                router.push(
                  `/story/${story.id}?listening=${listening ? "1" : "0"}`,
                );
              }}
            />
          ))}
        </View>
      </View>
    ),
    [courseShort, isOffline, isStoryDone, listening, router],
  );

  // Reload local progress whenever the tab regains focus (e.g. after a story).
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      if (!courseShort) return;
      void (async () => {
        const [done, listeningMode] = await Promise.all([
          getDoneMap(courseShort),
          getListeningMode(courseShort),
        ]);
        if (cancelled) return;
        setDoneMap(done);
        setListening(listeningMode);
      })();
      return () => {
        cancelled = true;
      };
    }, [courseShort]),
  );

  if (!ready) return <Centered spinner styles={styles} colors={colors} />;

  if (!courseShort) {
    return (
      <Centered>
        <Text style={styles.emptyTitle}>No course selected</Text>
        <Button
          title="Pick a course"
          onPress={() => router.navigate("/(tabs)/courses")}
          style={{ marginTop: 16 }}
        />
      </Centered>
    );
  }

  if (course === undefined) {
    if (isOffline) {
      return (
        <Centered>
          <Text style={styles.emptyTitle}>You're offline</Text>
          <Text style={styles.emptyText}>
            Connect to the internet to load this course's story list.
          </Text>
          <Button
            title="Courses"
            variant="secondary"
            onPress={() => router.navigate("/(tabs)/courses")}
            style={{ marginTop: 16, alignSelf: "stretch" }}
          />
        </Centered>
      );
    }

    return <Centered spinner styles={styles} colors={colors} />;
  }
  if (course === null) {
    return (
      <Centered>
        <Text style={styles.emptyTitle}>Course not available</Text>
        <Button
          title="Pick another course"
          onPress={() => router.navigate("/(tabs)/courses")}
          style={{ marginTop: 16 }}
        />
      </Centered>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{course.name}</Text>
        <Text style={styles.subtitle}>
          {isServerProgressPending
            ? "Loading progress..."
            : `${doneCount} / ${stories.length} stories completed`}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  stories.length > 0 ? (doneCount / stories.length) * 100 : 0
                }%`,
              },
            ]}
          />
        </View>
        <View style={styles.listeningRow}>
          <Text style={styles.listeningLabel}>Listening mode</Text>
          <Switch
            value={listening}
            onValueChange={(value) => {
              setListening(value);
              captureMobileEventLater("mobile_listening_mode_toggled", {
                course_short: courseShort,
                enabled: value,
              });
              void setListeningMode(courseShort, value);
            }}
            trackColor={{ true: colors.blue }}
            thumbColor={colors.surface}
          />
        </View>
      </View>

      <FlatList
        data={sets}
        keyExtractor={(set) => String(set.setId)}
        renderItem={renderStorySet}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          isOffline ? (
            <View style={styles.offlineWrap}>
              <OfflineNotice detail="Connect to the internet to open stories." />
            </View>
          ) : null
        }
        ListFooterComponent={<View style={styles.listFooter} />}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={Platform.OS === "android"}
        updateCellsBatchingPeriod={80}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

function Centered({
  children,
  colors,
  spinner,
  styles,
}: {
  children?: React.ReactNode;
  colors?: ThemeColors;
  spinner?: boolean;
  styles?: ReturnType<typeof createStyles>;
}) {
  const themed = useTheme();
  const activeColors = colors ?? themed.colors;
  const activeStyles = styles ?? createStyles(activeColors);

  return (
    <SafeAreaView style={activeStyles.root} edges={["top"]}>
      <View style={activeStyles.centered}>
        {spinner ? (
          <ActivityIndicator color={activeColors.blue} />
        ) : (
          children
        )}
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
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    emptyText: {
      marginTop: 8,
      fontSize: 16,
      lineHeight: 23,
      color: colors.textDim,
      textAlign: "center",
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    offlineWrap: {
      paddingHorizontal: 8,
      paddingTop: 12,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textDim,
      marginTop: 4,
    },
    progressTrack: {
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
      overflow: "hidden",
      marginTop: 10,
    },
    progressFill: {
      height: "100%",
      borderRadius: 6,
      backgroundColor: colors.gold,
    },
    listeningRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
    },
    listeningLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    set: {
      marginTop: 14,
    },
    setTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      paddingHorizontal: 8,
      marginBottom: 4,
    },
    setGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    listFooter: {
      height: 40,
    },
  });
}
