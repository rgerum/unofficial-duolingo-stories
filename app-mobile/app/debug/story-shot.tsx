import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "../../src/components/Text";
import { QuestionPrompt } from "../../src/story/elements/QuestionPrompt";
import { PointToPhraseQuestion } from "../../src/story/elements/PointToPhraseQuestion";
import { SelectPhraseQuestion } from "../../src/story/elements/SelectPhraseQuestion";
import { TextLine } from "../../src/story/elements/TextLine";
import { HintPopupHost } from "../../src/story/HintPopup";
import {
  StoryFeedback,
  StoryFeedbackFloat,
} from "../../src/story/StoryFeedback";
import { Footer } from "../../src/story/Footer";
import type {
  ContentWithHints,
  HideRange,
  StoryElementLine,
  StoryElementPointToPhrase,
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

function hiddenLineFixture({
  text,
  phrase,
  lang,
  lineIndex,
  rtl = false,
}: {
  text: string;
  phrase: string;
  lang: string;
  lineIndex: number;
  rtl?: boolean;
}): { element: StoryElementLine; rtl: boolean } {
  return {
    element: {
      type: "LINE",
      lang,
      trackingProperties: {
        line_index: lineIndex,
        challenge_type: "select-phrases",
      },
      hideRangesForChallenge: [hiddenRange(text, phrase)],
      line: {
        type: "PROSE",
        content: content({ text }),
      },
    },
    rtl,
  };
}

const hiddenRangeLines = [
  hiddenLineFixture({
    text: "We have a very important language exam tomorrow.",
    phrase: "very important language exam",
    lang: "en",
    lineIndex: 10,
  }),
  hiddenLineFixture({
    text: "Potřebuji klíče od svého auta.",
    phrase: "klíče od svého auta",
    lang: "cs",
    lineIndex: 11,
  }),
  hiddenLineFixture({
    text: "నా తాళం చెవులు ఎక్కడ ఉన్నాయి?",
    phrase: "తాళం చెవులు",
    lang: "te",
    lineIndex: 12,
  }),
  hiddenLineFixture({
    text: "אני צריך את המפתחות שלי.",
    phrase: "המפתחות שלי",
    lang: "he",
    lineIndex: 13,
    rtl: true,
  }),
  hiddenLineFixture({
    text: "أحتاج إلى مفاتيح سيارتي.",
    phrase: "مفاتيح سيارتي",
    lang: "ar",
    lineIndex: 14,
    rtl: true,
  }),
  hiddenLineFixture({
    text: "我需要我的车钥匙。",
    phrase: "我的车钥匙",
    lang: "zh",
    lineIndex: 15,
  }),
  hiddenLineFixture({
    text: "私は車の鍵が必要です。",
    phrase: "車の鍵",
    lang: "ja",
    lineIndex: 16,
  }),
];

const answers: StoryElementSelectPhrase = {
  type: "SELECT_PHRASE",
  lang: "cs",
  trackingProperties: { line_index: 5, challenge_type: "select-phrases" },
  answers: ["auta", "klíče", "svého", "od"],
  correctAnswerIndex: 1,
};

const pointToPhraseQuestion: StoryElementPointToPhrase = {
  type: "POINT_TO_PHRASE",
  lang: "ast",
  lang_question: "en",
  trackingProperties: { line_index: 20, challenge_type: "point-to-phrase" },
  question: content({ text: 'Choose the option that means "tired."' }),
  correctAnswerIndex: 2,
  transcriptParts: [
    { selectable: true, text: "Perdón" },
    { selectable: false, text: ", mio amor, " },
    { selectable: true, text: "toi" },
    { selectable: true, text: "cansada" },
    { selectable: false, text: " -¡" },
    { selectable: true, text: "Trabayo" },
    { selectable: false, text: " enferma!" },
  ],
};

function RealisticStoryFixture({
  includeLatinBlank,
  showHiddenRangeMatrix,
  showPointToPhrase,
  showRevealedBlank,
  showTeluguLine,
  debugTeluguLayout,
}: {
  includeLatinBlank: boolean;
  showHiddenRangeMatrix: boolean;
  showPointToPhrase: boolean;
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
      {showHiddenRangeMatrix ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Hidden range underline matrix
          </Text>
          {hiddenRangeLines.map(({ element, rtl }) => (
            <TextLine
              key={element.trackingProperties.line_index}
              element={element}
              active={false}
              unhide={0}
              rtl={rtl}
              autoPlay={false}
            />
          ))}
        </>
      ) : null}
      <SelectPhraseQuestion element={answers} advance={() => {}} />
      {showPointToPhrase ? (
        <PointToPhraseQuestion
          element={pointToPhraseQuestion}
          advance={() => {}}
        />
      ) : null}
    </View>
  );
}

export default function StoryShotScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ case?: string; debug?: string }>();
  const includeLatinBlank = params.case === "all" || params.case === "latin";
  const showHiddenRangeMatrix =
    params.case === "all" || params.case === "hide-ranges";
  const showPointToPhrase =
    params.case === "all" || params.case === "point-to-phrase";
  const showRevealedBlank = params.case === "all" || params.case === "revealed";
  const showTeluguLine = params.case === "all" || params.case === "telugu";
  const debugTeluguLayout = params.debug === "1";
  const showFeedback = params.case?.startsWith("feedback") ?? false;
  const listeningFeedback = params.case?.includes("listening") ?? false;
  const finishedFeedback = params.case?.includes("finished") ?? false;
  const correctFeedback = params.case?.includes("correct") ?? false;
  const openFeedback =
    params.case === "feedback" || params.case?.endsWith("-open");

  return (
    <HintPopupHost>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <RealisticStoryFixture
            includeLatinBlank={includeLatinBlank}
            showHiddenRangeMatrix={showHiddenRangeMatrix}
            showPointToPhrase={showPointToPhrase}
            showRevealedBlank={showRevealedBlank}
            showTeluguLine={showTeluguLine}
            debugTeluguLayout={debugTeluguLayout}
          />
        </ScrollView>
        {showFeedback ? (
          <View style={styles.footerFixture}>
            <StoryFeedbackFloat>
              <StoryFeedback
                storyId={1234}
                lineIndex={2}
                lineText="Eddy: నా తాళం చెవులు ఎక్కడ ఉన్నాయి?"
                lineElement={teluguLine}
                initialOpen={openFeedback}
                submitFeedback={() => Promise.resolve()}
              />
            </StoryFeedbackFloat>
            <Footer
              status={
                finishedFeedback
                  ? "finished"
                  : correctFeedback
                    ? "right"
                    : "continue"
              }
              onContinue={() => {}}
              listeningMode={listeningFeedback}
              listeningPaused={listeningFeedback}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },
  footerFixture: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
