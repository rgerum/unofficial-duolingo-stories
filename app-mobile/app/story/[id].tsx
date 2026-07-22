import React from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../src/api";
import { captureMobileEventLater } from "../../src/analytics";
import { useAuthSession } from "../../src/auth-client";
import { hasNoAudioCourseTag } from "../../src/course-tags";
import { useAppState } from "../../src/app-state";
import { useNetworkStatus } from "../../src/network";
import { markReviewPromptCompletionPending } from "../../src/reviewPrompt";
import { getDoneMap, markStoryDone } from "../../src/storage";
import { Reader } from "../../src/story/Reader";
import { HintPopupHost } from "../../src/story/HintPopup";
import { stopAudio } from "../../src/story/audio";
import { Button } from "../../src/components/Button";
import type { StoryListItem } from "../../src/components/StoryButton";
import { Text } from "../../src/components/Text";
import { type ThemeColors, useTheme } from "../../src/theme";
import type { StoryData } from "../../src/story/types";
import { syncNextStoryWidget } from "../../src/widgets/syncNextStoryWidget";

type CourseStory = StoryListItem & { image: string };

export default function StoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ id: string; listening?: string }>();
  const storyId = Number(params.id);
  const listening = params.listening === "1";
  const { hideStoryQuestions } = useAppState();
  const { data: session } = useAuthSession();
  const { isOffline } = useNetworkStatus();
  const recordStoryDone = useMutation(api.storyDone.recordStoryDone);
  const trackedStoryStart = React.useRef(false);
  const trackedStoryCompletion = React.useRef(false);

  const story = useQuery(
    api.storyRead.getStoryByLegacyId,
    Number.isFinite(storyId) ? { storyId } : "skip",
  ) as StoryData | null | undefined;
  const effectiveListening =
    story && story !== null && hasNoAudioCourseTag(story.course_tags)
      ? false
      : listening;

  // Course story list (anonymous-friendly) to pick the next unread story.
  const course = useQuery(
    api.landing.getPublicCoursePageData,
    story ? { short: story.course_short } : "skip",
  );
  const serverDoneIds = useQuery(
    api.storyDone.getDoneStoryIdsForCurrentUserInCourse,
    session?.session && story ? { courseShort: story.course_short } : "skip",
  );

  const [localDoneIds, setLocalDoneIds] = React.useState<Set<number> | null>(
    null,
  );
  React.useEffect(() => {
    if (!story) return;
    let cancelled = false;
    void getDoneMap(story.course_short).then((map) => {
      if (cancelled) return;
      setLocalDoneIds(new Set(Object.keys(map).map(Number)));
    });
    return () => {
      cancelled = true;
    };
  }, [story]);
  const doneIds = React.useMemo(() => {
    if (!localDoneIds && !serverDoneIds) return null;
    return new Set([...(localDoneIds ?? []), ...(serverDoneIds ?? [])]);
  }, [localDoneIds, serverDoneIds]);

  const nextStory = React.useMemo(() => {
    if (!course || !doneIds) return undefined;
    const stories = course.stories as CourseStory[];
    const currentIndex = stories.findIndex((item) => item.id === storyId);
    const candidates = stories.filter(
      (item) => item.id !== storyId && !doneIds.has(item.id),
    );
    if (candidates.length === 0) return null;
    const after = candidates.find((item) => {
      const index = stories.findIndex((entry) => entry.id === item.id);
      return index > currentIndex;
    });
    return after ?? candidates[0];
  }, [course, doneIds, storyId]);
  const nextStoryId = nextStory ? nextStory.id : nextStory;

  const captureStoryEvent = React.useCallback(
    (eventName: string, extra: Record<string, unknown> = {}) => {
      if (!story) return;
      captureMobileEventLater(eventName, {
        story_id: story.id,
        story_name: story.from_language_name,
        course_id: story.course_id,
        course_short: story.course_short,
        learning_language: story.learning_language_long,
        listening_mode: effectiveListening,
        hide_questions: effectiveListening || hideStoryQuestions,
        signed_in: Boolean(session?.session),
        ...extra,
      });
    },
    [effectiveListening, hideStoryQuestions, session?.session, story],
  );

  React.useEffect(() => {
    if (!story || trackedStoryStart.current) return;
    trackedStoryStart.current = true;
    captureStoryEvent("story_started");
  }, [captureStoryEvent, story]);

  const onFinishedReached = React.useCallback(() => {
    if (!story) return;
    const signedIn = Boolean(session?.session);
    const knownCompletedLocally = Boolean(localDoneIds?.has(story.id));
    const isServerProgressLoaded = !signedIn || serverDoneIds !== undefined;
    const wasAlreadyDone = doneIds?.has(story.id) ?? true;
    if (!trackedStoryCompletion.current) {
      trackedStoryCompletion.current = true;
      captureStoryEvent("story_completed");
    }
    if ((isServerProgressLoaded || knownCompletedLocally) && !wasAlreadyDone) {
      void markReviewPromptCompletionPending({
        courseShort: story.course_short,
        storyId: story.id,
      });
    }
    void markStoryDone(story.course_short, story.id);
    if (session?.session) {
      void recordStoryDone({ legacyStoryId: story.id });
    }
    if (course && doneIds) {
      const completedStoryIds = new Set(doneIds);
      completedStoryIds.add(story.id);
      void syncNextStoryWidget({
        courseName: course.name,
        stories: course.stories as CourseStory[],
        doneStoryIds: completedStoryIds,
        listening: effectiveListening,
      });
    }
  }, [
    captureStoryEvent,
    course,
    doneIds,
    effectiveListening,
    localDoneIds,
    recordStoryDone,
    serverDoneIds,
    session?.session,
    story,
  ]);

  const leave = React.useCallback(() => {
    stopAudio();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }, [router]);

  const retry = React.useCallback(() => {
    router.replace(
      `/story/${storyId}?listening=${effectiveListening ? "1" : "0"}`,
    );
  }, [effectiveListening, router, storyId]);

  const onQuit = React.useCallback(
    ({ shouldConfirmQuit }: { shouldConfirmQuit: boolean }) => {
      if (!shouldConfirmQuit) {
        leave();
        return;
      }

      Alert.alert("Quit story?", "Your place in this story won't be saved.", [
        { text: "Keep reading", style: "cancel" },
        {
          text: "Quit",
          style: "destructive",
          onPress: () => {
            captureStoryEvent("story_quit");
            leave();
          },
        },
      ]);
    },
    [captureStoryEvent, leave],
  );

  const onEnd = React.useCallback(() => {
    if (nextStoryId) {
      captureStoryEvent("story_end_next_clicked", {
        story_id: nextStoryId,
        completed_count: doneIds?.size,
        total_count: course?.stories.length,
      });
      stopAudio();
      router.replace(
        `/story/${nextStoryId}?listening=${effectiveListening ? "1" : "0"}`,
      );
      return;
    }
    leave();
  }, [
    captureStoryEvent,
    course?.stories.length,
    doneIds?.size,
    leave,
    effectiveListening,
    nextStoryId,
    router,
  ]);

  // Note: SafeAreaView reports zero insets in fullScreenModal screens, so the
  // Reader and Footer apply window insets themselves via useSafeAreaInsets.
  if (!Number.isFinite(storyId) || story === null) {
    return (
      <View style={styles.root}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Story not found</Text>
          <Button title="Go back" onPress={leave} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  if (story === undefined) {
    if (isOffline) {
      return (
        <View style={styles.root}>
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>You're offline</Text>
            <Text style={styles.errorBody}>
              Connect to the internet to load this story.
            </Text>
            <View style={styles.errorActions}>
              <Button title="Try again" onPress={retry} />
              <Button title="Go back" variant="secondary" onPress={leave} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.blue} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <HintPopupHost>
        <Reader
          key={story.id}
          story={story}
          hideQuestions={effectiveListening || hideStoryQuestions}
          listening={effectiveListening}
          onQuit={onQuit}
          onEnd={onEnd}
          onBackToOverview={leave}
          onFinishedReached={onFinishedReached}
          finishedLabel={nextStoryId ? "Next story" : "Finished"}
          nextStoryPreview={
            nextStory
              ? { title: nextStory.name, image: nextStory.active }
              : null
          }
          learningLanguageName={story.learning_language_long}
        />
      </HintPopupHost>
    </View>
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
    errorTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    errorBody: {
      fontSize: 16,
      lineHeight: 23,
      color: colors.textDim,
      textAlign: "center",
      marginTop: 8,
    },
    errorActions: {
      alignSelf: "stretch",
      gap: 12,
      marginTop: 18,
    },
  });
}
