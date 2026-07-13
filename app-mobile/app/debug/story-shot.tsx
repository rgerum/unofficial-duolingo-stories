import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "../../src/components/Text";
import { QuestionPrompt } from "../../src/story/elements/QuestionPrompt";
import { SelectPhraseQuestion } from "../../src/story/elements/SelectPhraseQuestion";
import { TextLine } from "../../src/story/elements/TextLine";
import { HintPopupHost } from "../../src/story/HintPopup";
import { StoryFeedback } from "../../src/story/StoryFeedback";
import { Footer } from "../../src/story/Footer";
import type {
  ContentWithHints,
  HideRange,
  StoryElementLine,
  StoryElementSelectPhrase,
} from "../../src/story/types";
import { useTheme } from "../../src/theme";

function hiddenRange(text: string, phrase: string): HideRange {
  const start = text.indexOf(phrase);
  if (start === -1) {
    throw new Error(`Missing fixture phrase: ${phrase}`);
  }
  return { start, end: start + phrase.length };
}

function content({
  text,
  hints = [],
  ranges = [],
  audio = false,
}: {
  text: string;
  hints?: string[];
  ranges?: Array<[number, number, number]>;
  audio?: boolean;
}): ContentWithHints {
  return {
    text,
    hintMap: ranges.map(([rangeFrom, rangeTo, hintIndex]) => ({
      rangeFrom,
      rangeTo,
      hintIndex,
    })),
    hints,
    ...(audio ? { audio: { url: "debug-audio.mp3" } } : null),
  };
}

const lucyAvatar = "https://duostories.org/icon192.png";
const eddyAvatar = "https://duostories.org/icon512.png";
const blankText = "Potřebuji klíče od svého auta.";

const normalJapaneseLine: StoryElementLine = {
  type: "LINE",
  lang: "ja",
  trackingProperties: { line_index: 0 },
  line: {
    type: "CHARACTER",
    characterId: "lucy",
    avatarUrl: lucyAvatar,
    content: content({
      text: "桜さんはコーヒーを飲みます。",
      ranges: [[4, 7, 0]],
      hints: ["coffee"],
    }),
  },
};

const normalLatinLine: StoryElementLine = {
  type: "LINE",
  lang: "da",
  trackingProperties: { line_index: 1 },
  line: {
    type: "CHARACTER",
    characterId: "eddy",
    avatarUrl: eddyAvatar,
    content: content({
      text: "Hvor   er   mine   nøgler?",
      ranges: [
        [0, 3, 0],
        [7, 8, 1],
        [12, 15, 2],
        [19, 24, 3],
      ],
      hints: ["where", "are", "my", "keys"],
    }),
  },
};

const teluguLine: StoryElementLine = {
  type: "LINE",
  lang: "te",
  trackingProperties: { line_index: 2 },
  line: {
    type: "CHARACTER",
    characterId: "eddy",
    avatarUrl: eddyAvatar,
    content: content({
      text: "నా తాళం చెవులు ఎక్కడ\nఉన్నాయి?",
      audio: true,
      ranges: [
        [0, 1, 0],
        [3, 6, 1],
        [8, 13, 2],
        [15, 19, 3],
        [21, 27, 4],
      ],
      hints: ["my", "lock", "keys", "where", "are"],
    }),
  },
};

const hiddenBlankLine: StoryElementLine = {
  type: "LINE",
  lang: "cs",
  trackingProperties: { line_index: 3, challenge_type: "select-phrases" },
  hideRangesForChallenge: [hiddenRange(blankText, "klíče od svého auta")],
  line: {
    type: "CHARACTER",
    characterId: "lucy",
    avatarUrl: lucyAvatar,
    content: content({ text: blankText }),
  },
};

const hiddenLatinLine: StoryElementLine = {
  type: "LINE",
  lang: "en",
  trackingProperties: { line_index: 4, challenge_type: "select-phrases" },
  hideRangesForChallenge: [
    hiddenRange(
      "We have a very important language exam tomorrow.",
      "very important language exam",
    ),
  ],
  line: {
    type: "PROSE",
    content: content({
      text: "We have a very important language exam tomorrow.",
    }),
  },
};

const answers: StoryElementSelectPhrase = {
  type: "SELECT_PHRASE",
  lang: "cs",
  trackingProperties: { line_index: 5, challenge_type: "select-phrases" },
  answers: ["auta", "klíče", "svého", "od"],
  correctAnswerIndex: 1,
};

function RealisticStoryFixture({
  includeLatinBlank,
  showRevealedBlank,
  showTeluguLine,
  debugTeluguLayout,
}: {
  includeLatinBlank: boolean;
  showRevealedBlank: boolean;
  showTeluguLine: boolean;
  debugTeluguLayout: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.storyCard}>
      <Text style={[styles.title, { color: colors.text }]}>Story fixture</Text>
      <TextLine
        element={normalJapaneseLine}
        active={false}
        rtl={false}
        autoPlay={false}
      />
      <TextLine
        element={normalLatinLine}
        active={false}
        rtl={false}
        autoPlay={false}
      />
      {showTeluguLine ? (
        <TextLine
          element={teluguLine}
          active={false}
          rtl={false}
          autoPlay={false}
          debugNativeLayout={debugTeluguLayout}
        />
      ) : null}
      <QuestionPrompt
        question={content({ text: "Select the missing phrase" })}
        lang="en"
      />
      <TextLine
        element={hiddenBlankLine}
        active={false}
        unhide={0}
        rtl={false}
        autoPlay={false}
      />
      {includeLatinBlank ? (
        <TextLine
          element={hiddenLatinLine}
          active={false}
          unhide={0}
          rtl={false}
          autoPlay={false}
        />
      ) : null}
      {showRevealedBlank ? (
        <TextLine
          element={hiddenBlankLine}
          active={false}
          unhide={-1}
          rtl={false}
          autoPlay={false}
        />
      ) : null}
      <SelectPhraseQuestion element={answers} advance={() => {}} />
    </View>
  );
}

export default function StoryShotScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ case?: string; debug?: string }>();
  const includeLatinBlank = params.case === "all" || params.case === "latin";
  const showRevealedBlank = params.case === "all" || params.case === "revealed";
  const showTeluguLine = params.case === "all" || params.case === "telugu";
  const debugTeluguLayout = params.debug === "1";
  const showFeedback =
    params.case === "feedback" || params.case === "feedback-trigger";

  return (
    <HintPopupHost>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <RealisticStoryFixture
            includeLatinBlank={includeLatinBlank}
            showRevealedBlank={showRevealedBlank}
            showTeluguLine={showTeluguLine}
            debugTeluguLayout={debugTeluguLayout}
          />
        </ScrollView>
        {showFeedback ? (
          <View style={styles.footerFixture}>
            <Footer
              status="continue"
              onContinue={() => {}}
              feedback={
                <StoryFeedback
                  storyId={1234}
                  lineIndex={1}
                  lineText="Lucy: I think my keys are in the car."
                  initialOpen={params.case === "feedback"}
                  submitFeedback={() => Promise.resolve()}
                />
              }
            />
          </View>
        ) : null}
      </View>
    </HintPopupHost>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 150,
  },
  storyCard: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  footerFixture: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
