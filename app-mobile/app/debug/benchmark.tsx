import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../src/components/Text";
import {
  darkColors,
  fontSizes,
  lightColors,
  ThemeContext,
  type ThemeColors,
  type ThemePreference,
  useTheme,
} from "../../src/theme";
import {
  arrange,
  characterLine,
  CHIP_GALLERY,
  EXERCISE_FIXTURES,
  LANGUAGE_FIXTURES,
  proseLine,
  titleLine,
} from "../../src/debug-benchmark/fixtures";
import casesRegistry from "../../src/debug-benchmark/cases.json";
import { HintPopupContext, HintPopupHost } from "../../src/story/HintPopup";
import { WordChip, type ChipStatus } from "../../src/story/WordChip";
import type { ChoiceState } from "../../src/story/useChoiceButtons";
import { TextLine } from "../../src/story/elements/TextLine";
import { MultipleChoiceQuestion } from "../../src/story/elements/MultipleChoiceQuestion";
import { SelectPhraseQuestion } from "../../src/story/elements/SelectPhraseQuestion";
import { ArrangeQuestion } from "../../src/story/elements/ArrangeQuestion";
import { PointToPhraseQuestion } from "../../src/story/elements/PointToPhraseQuestion";
import { MatchQuestion } from "../../src/story/elements/MatchQuestion";
import type { StoryElementArrange } from "../../src/story/types";

const AVATAR_URL = "https://duostories.org/icon192.png";
const CHIP_STATUSES: ChipStatus[] = [
  "idle",
  "selected",
  "right",
  "right-stay",
  "matched",
  "wrong",
  "off",
];

type BenchmarkCase = (typeof casesRegistry.cases)[number];
type Styles = ReturnType<typeof createStyles>;

function choiceRightState(count: number, rightIndex: number): ChoiceState[] {
  return new Array(count)
    .fill(undefined)
    .map((_, index) => (index === rightIndex ? "right" : "done"));
}

function choiceWrongState(count: number, wrongIndex: number): ChoiceState[] {
  return new Array(count)
    .fill(undefined)
    .map((_, index) => (index === wrongIndex ? "false" : undefined));
}

function choiceWrongThenRightState(
  count: number,
  rightIndex: number,
): ChoiceState[] {
  const wrongIndex = rightIndex === 0 ? 1 : 0;
  return new Array(count).fill(undefined).map((_, index) => {
    if (index === rightIndex) return "right";
    if (index === wrongIndex) return "false";
    return "done";
  });
}

function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function findLanguage(lang: string) {
  return LANGUAGE_FIXTURES.find((fixture) => fixture.lang === lang);
}

function findExercise(lang: string) {
  return EXERCISE_FIXTURES.find((fixture) => fixture.lang === lang);
}

export default function BenchmarkRoute() {
  const params = useLocalSearchParams<{ case?: string; theme?: string }>();
  const resolvedTheme: "light" | "dark" =
    params.theme === "dark" ? "dark" : "light";
  const colors = resolvedTheme === "dark" ? darkColors : lightColors;
  const preference: ThemePreference = resolvedTheme;
  const value = React.useMemo(
    () => ({
      colors,
      preference,
      resolvedTheme,
      ready: true,
      setPreference: async () => undefined,
    }),
    [colors, preference, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <BenchmarkContent caseId={params.case} />
    </ThemeContext.Provider>
  );
}

function BenchmarkContent({ caseId }: { caseId?: string }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <HintPopupHost>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 12 },
          ]}
        >
          {renderCase(caseId, styles)}
        </ScrollView>
      </HintPopupHost>
    </View>
  );
}

function renderCase(caseId: string | undefined, styles: Styles) {
  if (!caseId) return <CaseList styles={styles} />;

  if (caseId.startsWith("lines-")) {
    const fixture = findLanguage(caseId.slice("lines-".length));
    return fixture ? (
      <LinesCase fixture={fixture} styles={styles} />
    ) : (
      <CaseList styles={styles} />
    );
  }

  if (caseId.startsWith("hint-")) {
    const lang = caseId === "hint-edge-ar" ? "ar" : caseId.slice("hint-".length);
    const fixture = findLanguage(lang);
    return fixture ? (
      <HintCase
        fixture={fixture}
        edge={caseId === "hint-edge-ar"}
        styles={styles}
      />
    ) : (
      <CaseList styles={styles} />
    );
  }

  if (caseId.startsWith("ex-")) {
    const [, kind, lang] = caseId.split("-");
    const fixture = findExercise(lang);
    return fixture ? (
      <ExerciseCase kind={kind} fixture={fixture} styles={styles} />
    ) : (
      <CaseList styles={styles} />
    );
  }

  if (caseId === "chips") return <ChipsCase styles={styles} />;

  return <CaseList styles={styles} />;
}

function Caption({
  children,
  styles,
}: {
  children: React.ReactNode;
  styles: Styles;
}) {
  return <Text style={styles.caption}>{children}</Text>;
}

function Block({
  caption,
  styles,
  children,
}: {
  caption: string;
  styles: Styles;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.block}>
      <Caption styles={styles}>{caption}</Caption>
      {children}
    </View>
  );
}

function LinesCase({
  fixture,
  styles,
}: {
  fixture: NonNullable<ReturnType<typeof findLanguage>>;
  styles: Styles;
}) {
  const hiddenLine = characterLine(fixture.lang, fixture.question, {
    avatarUrl: AVATAR_URL,
    hide: fixture.hidePhrase,
  });

  return (
    <>
      <Text style={styles.heading}>{fixture.label}</Text>
      <Block caption="title" styles={styles}>
        <TextLine
          element={titleLine(fixture.lang, fixture.title)}
          active={false}
          rtl={fixture.rtl}
          autoPlay={false}
        />
      </Block>
      <Block caption="hints" styles={styles}>
        <TextLine
          element={characterLine(fixture.lang, fixture.greeting, {
            avatarUrl: AVATAR_URL,
          })}
          active={false}
          rtl={fixture.rtl}
          autoPlay={false}
        />
      </Block>
      <Block caption="wrap" styles={styles}>
        <TextLine
          element={proseLine(fixture.lang, fixture.long)}
          active={false}
          rtl={fixture.rtl}
          autoPlay={false}
        />
      </Block>
      <Block caption="hidden" styles={styles}>
        <TextLine
          element={hiddenLine}
          active={false}
          rtl={fixture.rtl}
          autoPlay={false}
          unhide={0}
        />
      </Block>
      <Block caption="revealed" styles={styles}>
        <TextLine
          element={hiddenLine}
          active={false}
          rtl={fixture.rtl}
          autoPlay={false}
          unhide={-1}
        />
      </Block>
      <Block caption="audio dim" styles={styles}>
        <TextLine
          element={characterLine(fixture.lang, fixture.greeting, {
            avatarUrl: AVATAR_URL,
          })}
          active={false}
          rtl={fixture.rtl}
          autoPlay={false}
          audioRangeOverride={Math.floor(fixture.greeting.text.length / 2)}
        />
      </Block>
    </>
  );
}

function HintCase({
  fixture,
  edge,
  styles,
}: {
  fixture: NonNullable<ReturnType<typeof findLanguage>>;
  edge: boolean;
  styles: Styles;
}) {
  const popup = React.useContext(HintPopupContext);

  // The line that actually contains the popup's hint word, so the shot is
  // realistic: the popup anchors on the word's measured position through the
  // real anchoring math (TextLine -> HintText debugAutoShowHintIndex).
  const hintIndex = fixture.question.hints?.indexOf(fixture.popupHint[1]) ?? -1;

  // Edge case only: force an x at the screen edge to exercise the popup's
  // horizontal clamping — this one keeps synthetic coordinates on purpose.
  React.useEffect(() => {
    if (!edge) return;
    const show = () =>
      popup.show({
        translation: fixture.popupHint[1],
        pronunciation: fixture.popupHint[2],
        x: 12,
        y: 300,
      });
    // The popup auto-dismisses after 2.5s; re-show so the screenshot
    // driver always catches it regardless of capture timing.
    const timer = setTimeout(show, 400);
    const keepAlive = setInterval(show, 1500);
    return () => {
      clearTimeout(timer);
      clearInterval(keepAlive);
    };
  }, [edge, fixture.popupHint, popup]);

  return (
    <>
      <Text style={styles.heading}>{fixture.label}</Text>
      <Block caption={edge ? "edge hint popup" : "hint popup"} styles={styles}>
        <TextLine
          element={characterLine(fixture.lang, fixture.question, {
            avatarUrl: AVATAR_URL,
          })}
          active={false}
          rtl={fixture.rtl}
          autoPlay={false}
          debugAutoShowHintIndex={
            !edge && hintIndex >= 0 ? hintIndex : undefined
          }
        />
      </Block>
    </>
  );
}

function ExerciseCase({
  kind,
  fixture,
  styles,
}: {
  kind: string;
  fixture: NonNullable<ReturnType<typeof findExercise>>;
  styles: Styles;
}) {
  if (kind === "mc") {
    const element = fixture.multipleChoice;
    return (
      <>
        <Text style={styles.heading}>Multiple choice - {fixture.lang}</Text>
        <Block caption="unanswered" styles={styles}>
          <MultipleChoiceQuestion element={element} advance={() => undefined} />
        </Block>
        <Block caption="wrong" styles={styles}>
          <MultipleChoiceQuestion
            element={element}
            advance={() => undefined}
            debugInitialState={choiceWrongState(element.answers.length, 1)}
          />
        </Block>
        <Block caption="right" styles={styles}>
          <MultipleChoiceQuestion
            element={element}
            advance={() => undefined}
            debugInitialState={choiceRightState(
              element.answers.length,
              element.correctAnswerIndex,
            )}
          />
        </Block>
      </>
    );
  }

  if (kind === "select") {
    const element = fixture.selectPhrase;
    return (
      <>
        <Text style={styles.heading}>Select phrase - {fixture.lang}</Text>
        <SelectBlock caption="unanswered" fixture={fixture} styles={styles}>
          <SelectPhraseQuestion element={element} advance={() => undefined} />
        </SelectBlock>
        <SelectBlock caption="wrong" fixture={fixture} styles={styles}>
          <SelectPhraseQuestion
            element={element}
            advance={() => undefined}
            debugInitialState={choiceWrongState(element.answers.length, 1)}
          />
        </SelectBlock>
        <SelectBlock caption="right-stay" fixture={fixture} styles={styles}>
          <SelectPhraseQuestion
            element={element}
            advance={() => undefined}
            debugInitialState={choiceRightState(
              element.answers.length,
              element.correctAnswerIndex,
            )}
          />
        </SelectBlock>
      </>
    );
  }

  if (kind === "arrange") {
    const element = arrange(
      fixture.lang,
      fixture.arrangeLine.line.content.text,
      fixture.arrangePhrases,
    );
    return (
      <>
        <Text style={styles.heading}>Arrange - {fixture.lang}</Text>
        <ArrangeBlock
          caption="fresh"
          fixture={fixture}
          element={element}
          placedCount={0}
          styles={styles}
        />
        <ArrangeBlock
          caption="mid-progress"
          fixture={fixture}
          element={element}
          placedCount={2}
          styles={styles}
        />
        <ArrangeBlock
          caption="wrong flash"
          fixture={fixture}
          element={element}
          placedCount={0}
          wrongIndex={element.phraseOrder.findIndex(
            (position) => position !== 0,
          )}
          styles={styles}
        />
      </>
    );
  }

  if (kind === "point") {
    const element = fixture.pointToPhrase;
    const selectableCount = element.transcriptParts.filter(
      (part) => part.selectable,
    ).length;
    return (
      <>
        <Text style={styles.heading}>Point to phrase - {fixture.lang}</Text>
        <Block caption="unanswered" styles={styles}>
          <PointToPhraseQuestion element={element} advance={() => undefined} />
        </Block>
        <Block caption="wrong + right" styles={styles}>
          <PointToPhraseQuestion
            element={element}
            advance={() => undefined}
            debugInitialState={choiceWrongThenRightState(
              selectableCount,
              element.correctAnswerIndex,
            )}
          />
        </Block>
      </>
    );
  }

  if (kind === "match") {
    const element = fixture.match;
    const forcedStates = buildMatchForcedStates(element.fallbackHints);
    return (
      <>
        <Text style={styles.heading}>Match - {fixture.lang}</Text>
        <Block caption="mixed states" styles={styles}>
          <MatchQuestion
            element={element}
            setDone={() => undefined}
            debugRandom={makeRandom(23)}
            debugForcedStates={forcedStates}
          />
        </Block>
      </>
    );
  }

  return <CaseList styles={styles} />;
}

function SelectBlock({
  caption,
  fixture,
  styles,
  children,
}: {
  caption: string;
  fixture: NonNullable<ReturnType<typeof findExercise>>;
  styles: Styles;
  children: React.ReactNode;
}) {
  return (
    <Block caption={caption} styles={styles}>
      <TextLine
        element={fixture.selectPhraseLine}
        active={false}
        rtl={fixture.rtl}
        autoPlay={false}
        unhide={0}
      />
      {children}
    </Block>
  );
}

function ArrangeBlock({
  caption,
  fixture,
  element,
  placedCount,
  wrongIndex,
  styles,
}: {
  caption: string;
  fixture: NonNullable<ReturnType<typeof findExercise>>;
  element: StoryElementArrange;
  placedCount: number;
  wrongIndex?: number;
  styles: Styles;
}) {
  const revealPosition =
    placedCount > 0 ? (element.characterPositions?.[placedCount - 1] ?? 0) : 0;
  return (
    <Block caption={caption} styles={styles}>
      <TextLine
        element={fixture.arrangeLine}
        active={false}
        rtl={fixture.rtl}
        autoPlay={false}
        unhide={revealPosition}
      />
      <ArrangeQuestion
        element={element}
        advance={() => undefined}
        debugPlacedCount={placedCount}
        debugWrongIndex={wrongIndex}
      />
    </Block>
  );
}

function buildMatchForcedStates(
  pairs: Array<{ phrase: string; translation: string }>,
) {
  const states: Record<
    string,
    "idle" | "selected" | "right" | "matched" | "wrong"
  > = {};
  if (pairs[0]) {
    states[pairs[0].phrase] = "matched";
    states[pairs[0].translation] = "matched";
  }
  if (pairs[1]) states[pairs[1].phrase] = "selected";
  if (pairs[2]) {
    states[pairs[2].phrase] = "right";
    states[pairs[2].translation] = "right";
  }
  if (pairs[3]) states[pairs[3].translation] = "wrong";
  return states;
}

function ChipsCase({ styles }: { styles: Styles }) {
  return (
    <>
      <Text style={styles.heading}>WordChip gallery</Text>
      {CHIP_GALLERY.map((entry) => (
        <View key={entry.lang} style={styles.chipRow}>
          <Text style={styles.chipRowLabel}>{entry.label}</Text>
          <View style={styles.chipWrapRow}>
            {CHIP_STATUSES.map((status) => (
              <View key={status} style={styles.chipCell}>
                <Text style={styles.chipHeader}>{status}</Text>
                <WordChip status={status} labelLang={entry.lang}>
                  {entry.word}
                </WordChip>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

function CaseList({ styles }: { styles: Styles }) {
  const grouped = casesRegistry.cases.reduce<Record<string, BenchmarkCase[]>>(
    (groups, entry) => {
      groups[entry.group] ??= [];
      groups[entry.group].push(entry);
      return groups;
    },
    {},
  );

  return (
    <>
      <Text style={styles.heading}>Benchmark cases</Text>
      {Object.entries(grouped).map(([group, entries]) => (
        <View key={group} style={styles.caseGroup}>
          <Text style={styles.caseGroupTitle}>{group}</Text>
          {entries.map((entry) => (
            <Text key={entry.id} style={styles.caseLine}>
              {entry.case}?theme={entry.theme} - {entry.note}
            </Text>
          ))}
        </View>
      ))}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 48,
    },
    heading: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
    },
    block: {
      marginBottom: 24,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.disabled,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    chipRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 10,
    },
    chipRowLabel: {
      fontSize: 13,
      lineHeight: 17,
      color: colors.textDim,
      marginBottom: 6,
    },
    chipWrapRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-end",
      columnGap: 10,
      rowGap: 12,
    },
    chipHeader: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.disabled,
      textAlign: "center",
      marginBottom: 2,
    },
    chipCell: {
      alignItems: "center",
      justifyContent: "flex-end",
    },
    caseGroup: {
      marginTop: 12,
    },
    caseGroupTitle: {
      fontSize: fontSizes.body,
      lineHeight: 24,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },
    caseLine: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textDim,
      marginBottom: 2,
    },
  });
}
