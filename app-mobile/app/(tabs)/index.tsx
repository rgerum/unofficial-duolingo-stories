import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../src/api";
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
import { colors } from "../../src/theme";

/** Learn tab: the current course's stories, grouped by set. */
export default function LearnTab() {
  const router = useRouter();
  const { ready, courseShort } = useAppState();
  const { data: session } = useAuthSession();
  const { isOffline } = useNetworkStatus();

  const course = useQuery(
    api.landing.getPublicCoursePageData,
    courseShort ? { short: courseShort } : "skip",
  );
  const serverDoneIds = useQuery(
    api.storyDone.getDoneStoryIdsForCurrentUserInCourse,
    session?.session && courseShort ? { courseShort } : "skip",
  );

  const [doneMap, setDoneMap] = React.useState<DoneMap>({});
  const [listening, setListening] = React.useState(false);
  const serverDoneSet = React.useMemo(
    () => new Set(serverDoneIds ?? []),
    [serverDoneIds],
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

  if (!ready) return <Centered spinner />;

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

    return <Centered spinner />;
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

  const stories = course.stories as StoryListItem[];
  const isStoryDone = (storyId: number) =>
    serverDoneSet.has(storyId) || Boolean(doneMap[String(storyId)]);
  const doneCount = stories.filter((story) => isStoryDone(story.id)).length;

  // Stories arrive sorted by (set_id, set_index); group them into sets.
  const sets: { setId: number; stories: StoryListItem[] }[] = [];
  for (const story of stories) {
    const last = sets[sets.length - 1];
    if (last && last.setId === story.set_id) last.stories.push(story);
    else sets.push({ setId: story.set_id, stories: [story] });
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{course.name}</Text>
        <Text style={styles.subtitle}>
          {doneCount} / {stories.length} stories completed
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
              void setListeningMode(courseShort, value);
            }}
            trackColor={{ true: colors.blue }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isOffline ? (
          <View style={styles.offlineWrap}>
            <OfflineNotice detail="Connect to the internet to open stories." />
          </View>
        ) : null}

        {sets.map((set) => (
          <View key={set.setId} style={styles.set}>
            <Text style={styles.setTitle}>Set {set.setId}</Text>
            <View style={styles.setGrid}>
              {set.stories.map((story) => (
                <StoryButton
                  key={story.id}
                  story={story}
                  done={isStoryDone(story.id)}
                  listeningMode={listening}
                  disabled={isOffline}
                  onPress={() =>
                    router.push(
                      `/story/${story.id}?listening=${listening ? "1" : "0"}`,
                    )
                  }
                />
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Centered({
  children,
  spinner,
}: {
  children?: React.ReactNode;
  spinner?: boolean;
}) {
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.centered}>
        {spinner ? <ActivityIndicator color={colors.blue} /> : children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
