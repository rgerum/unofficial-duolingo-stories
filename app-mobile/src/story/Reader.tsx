import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { Text } from "../components/Text";
import {
  getInitialButtonStatus,
  getNextVisibleStoryProgress,
  getPartIndex,
  getParts,
  getVisibleStoryLength,
  getVisibleStoryProgress,
  shouldSkipStoryPart,
} from "./parts";
import { onAnyAudioDone, stopAudio } from "./audio";
import { playSoundEffect } from "./soundEffects";
import { Part } from "./Part";
import { Footer, type NextStoryPreview } from "./Footer";
import { HintLookupContext } from "./HintPopup";
import { SmartImage } from "../components/SmartImage";
import type { StoryData } from "./types";

const noop = () => {};

/**
 * The progressive-reveal reading engine — a mobile port of the web's
 * StoryProgress component, minus editor/print concerns.
 */
export function Reader({
  story,
  hideQuestions,
  listening,
  onQuit,
  onEnd,
  onBackToOverview,
  onFinishedReached,
  finishedLabel,
  nextStoryPreview,
  learningLanguageName,
}: {
  story: StoryData;
  hideQuestions: boolean;
  /** Listening mode: questions hidden and lines auto-advance after audio. */
  listening: boolean;
  onQuit: (options: { shouldConfirmQuit: boolean }) => void;
  onEnd: () => void | Promise<void>;
  onBackToOverview: () => void;
  onFinishedReached: () => void;
  finishedLabel?: string;
  nextStoryPreview?: NextStoryPreview | null;
  learningLanguageName?: string;
}) {
  // SafeAreaView reports zero insets inside fullScreenModal screens, so the
  // reader applies window insets itself.
  const insets = useSafeAreaInsets();

  const partsList = React.useMemo(
    () => getParts(story.elements),
    [story.elements],
  );

  const [storyProgress, setStoryProgress] = React.useState(() =>
    getNextVisibleStoryProgress(partsList, -1, hideQuestions),
  );
  const [partProgress, setPartProgress] = React.useState(0);
  const [buttonStatus, setButtonStatus] = React.useState(() => {
    const initial = getNextVisibleStoryProgress(partsList, -1, hideQuestions);
    return initial >= partsList.length
      ? "finished"
      : getInitialButtonStatus(partsList[initial], hideQuestions);
  });
  const [listeningPaused, setListeningPaused] = React.useState(false);
  const [audioReplayKey, setAudioReplayKey] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  const isFinished = storyProgress >= partsList.length;

  // Stop any line audio when the reader unmounts.
  React.useEffect(() => stopAudio, []);

  React.useEffect(() => {
    if (!listening) setListeningPaused(false);
  }, [listening]);

  // Same cues as the web's StoryProgress: chime on a right answer, fanfare
  // when the story is finished.
  const previousButtonStatus = React.useRef(buttonStatus);
  React.useEffect(() => {
    if (previousButtonStatus.current !== buttonStatus) {
      if (buttonStatus === "right") playSoundEffect("right");
      if (buttonStatus === "finished") playSoundEffect("done");
    }
    previousButtonStatus.current = buttonStatus;
  }, [buttonStatus]);

  const next = React.useCallback(async () => {
    if (buttonStatus === "finished") {
      setButtonStatus("...");
      await onEnd();
      return;
    }
    if (buttonStatus === "wait" || buttonStatus === "...") return;
    if (buttonStatus === "idle") {
      setButtonStatus("wait");
      setPartProgress(1);
      return;
    }
    if (buttonStatus === "continue" || buttonStatus === "right") {
      const nextProgress = getNextVisibleStoryProgress(
        partsList,
        storyProgress,
        hideQuestions,
      );
      setPartProgress(0);
      setStoryProgress(nextProgress);
      setButtonStatus(
        nextProgress >= partsList.length
          ? "finished"
          : getInitialButtonStatus(partsList[nextProgress], hideQuestions),
      );
    }
  }, [buttonStatus, hideQuestions, onEnd, partsList, storyProgress]);

  const pauseListening = React.useCallback(() => {
    stopAudio(false);
    setListeningPaused(true);
  }, []);

  const handleHintLookup = React.useCallback(() => {
    stopAudio(false);
    if (listening) setListeningPaused(true);
  }, [listening]);

  const playListening = React.useCallback(() => {
    setListeningPaused(false);
    setAudioReplayKey((key) => key + 1);
  }, []);

  const replayListening = React.useCallback(() => {
    stopAudio();
    setListeningPaused(false);
    setAudioReplayKey((key) => key + 1);
  }, []);

  const skipListening = React.useCallback(() => {
    stopAudio();
    setListeningPaused(false);
    void next();
  }, [next]);

  const handleManualAudioPlay = React.useCallback(
    (partIndex: number) => {
      if (!listening) return;
      setListeningPaused(false);
      setPartProgress(0);
      setStoryProgress(partIndex);
      setButtonStatus(getInitialButtonStatus(partsList[partIndex], hideQuestions));
    },
    [hideQuestions, listening, partsList],
  );

  // Record completion exactly once when the end is reached.
  const finishedNotified = React.useRef(false);
  React.useEffect(() => {
    if (isFinished && !finishedNotified.current) {
      finishedNotified.current = true;
      stopAudio();
      onFinishedReached();
    }
  }, [isFinished, onFinishedReached]);

  // Listening mode: advance automatically when a line's audio finishes.
  const nextRef = React.useRef(next);
  nextRef.current = next;
  const buttonStatusRef = React.useRef(buttonStatus);
  buttonStatusRef.current = buttonStatus;
  const listeningPausedRef = React.useRef(listeningPaused);
  listeningPausedRef.current = listeningPaused;
  React.useEffect(() => {
    if (!listening) return;
    return onAnyAudioDone(() => {
      setTimeout(() => {
        if (
          !listeningPausedRef.current &&
          buttonStatusRef.current === "continue"
        ) {
          void nextRef.current();
        }
      }, 500);
    });
  }, [listening]);

  // Keep the newest line in view: onContentSizeChange fires the moment new
  // content is laid out, so the scroll starts immediately (no fixed delay).
  const scrollToNewContent = React.useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const visibleLength = getVisibleStoryLength(partsList, hideQuestions);
  const visibleProgress = getVisibleStoryProgress(
    partsList,
    storyProgress,
    hideQuestions,
  );
  const shouldConfirmQuit = !isFinished && visibleProgress > 0;
  const revealedParts = partsList.filter(
    (parts) =>
      !shouldSkipStoryPart(parts, hideQuestions) &&
      getPartIndex(parts) <= storyProgress,
  );

  return (
    <HintLookupContext.Provider value={handleHintLookup}>
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close story"
            onPress={() => onQuit({ shouldConfirmQuit })}
            hitSlop={10}
          >
            <Ionicons name="close" size={28} color={colors.textDim} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    visibleLength > 0
                      ? Math.min(100, (visibleProgress / visibleLength) * 100)
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {isFinished ? (
          // Full-screen takeover, like the web's finished page: the transcript
          // disappears and the gilded illustration takes center stage.
          <View style={styles.finished}>
            <SmartImage
              uri={story.illustrations?.gilded ?? story.illustrations?.active}
              width={200}
              height={200}
            />
            <Text style={styles.finishedTitle}>Story completed!</Text>
            <Text style={styles.finishedSubtitle}>
              You have finished {story.from_language_name}
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            onContentSizeChange={scrollToNewContent}
          >
            {revealedParts.map((parts) => {
              const index = getPartIndex(parts);
              const active = index === storyProgress;
              return (
                <Part
                  key={index}
                  parts={parts}
                  partProgress={partProgress}
                  setButtonStatus={active ? setButtonStatus : noop}
                  active={active}
                  settings={{
                    hideQuestions,
                    rtl: story.learning_language_rtl,
                    audioAutoPlay: !listeningPaused,
                    audioReplayKey,
                    onManualAudioPlay: () => handleManualAudioPlay(index),
                  }}
                />
              );
            })}
            <View style={{ height: 220 }} />
          </ScrollView>
        )}

        <View style={styles.footerOverlay}>
          <Footer
            status={buttonStatus}
            onContinue={() => void next()}
            onBackToOverview={onBackToOverview}
            finishedLabel={finishedLabel}
            nextStoryPreview={nextStoryPreview}
            learningLanguageName={learningLanguageName}
            listeningMode={listening && !isFinished}
            listeningPaused={listeningPaused}
            onToggleListening={listeningPaused ? playListening : pauseListening}
            onReplayListening={replayListening}
            onSkipListening={skipListening}
          />
        </View>
      </View>
    </HintLookupContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 7,
    backgroundColor: colors.green,
  },
  scroll: {
    flex: 1,
  },
  // The footer floats over the scroll area (like the web's fixed footer) so
  // the "You are correct" banner growing it never shifts the transcript.
  footerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  finished: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    // keep the centered content clear of the taller finished footer
    paddingBottom: 200,
  },
  finishedTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginTop: 28,
  },
  finishedSubtitle: {
    fontSize: 20,
    color: colors.text,
    marginTop: 10,
  },
});
