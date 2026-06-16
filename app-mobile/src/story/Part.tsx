import React from "react";
import { getPartKind } from "./parts";
import { FadeIn } from "./FadeIn";
import { Header } from "./elements/Header";
import { TextLine } from "./elements/TextLine";
import { QuestionPrompt } from "./elements/QuestionPrompt";
import { MultipleChoiceQuestion } from "./elements/MultipleChoiceQuestion";
import { SelectPhraseQuestion } from "./elements/SelectPhraseQuestion";
import { ArrangeQuestion } from "./elements/ArrangeQuestion";
import { PointToPhraseQuestion } from "./elements/PointToPhraseQuestion";
import { MatchQuestion } from "./elements/MatchQuestion";
import type {
  StoryElement,
  StoryElementArrange,
  StoryElementChallengePrompt,
  StoryElementHeader,
  StoryElementLine,
  StoryElementMatch,
  StoryElementMultipleChoice,
  StoryElementPointToPhrase,
  StoryElementSelectPhrase,
} from "./types";

// Each part mirrors a web StoryChallenge* wrapper: it renders the lines and
// question of one reveal step and drives the footer button status.

export type PartSettings = {
  hideQuestions: boolean;
  rtl: boolean;
  audioAutoPlay: boolean;
  audioReplayKey: number;
};

export type PartProps = {
  parts: StoryElement[];
  partProgress: number;
  setButtonStatus: (status: string) => void;
  active: boolean;
  settings: PartSettings;
};

function HeaderPart({ parts, active, setButtonStatus, settings }: PartProps) {
  React.useEffect(() => {
    if (active) setButtonStatus("continue");
  }, [active, setButtonStatus]);
  return (
    <FadeIn>
      <Header
        element={parts[0] as StoryElementHeader}
        active={active}
        rtl={settings.rtl}
        autoPlay={settings.audioAutoPlay}
        replayKey={settings.audioReplayKey}
      />
    </FadeIn>
  );
}

function LinePart({ parts, active, setButtonStatus, settings }: PartProps) {
  React.useEffect(() => {
    if (active) setButtonStatus("continue");
  }, [active, setButtonStatus]);
  const element = parts[0];
  if (element.type !== "LINE") return null;
  return (
    <FadeIn>
      <TextLine
        element={element}
        active={active}
        rtl={settings.rtl}
        autoPlay={settings.audioAutoPlay}
        replayKey={settings.audioReplayKey}
      />
    </FadeIn>
  );
}

function MultipleChoicePart({
  parts,
  partProgress,
  setButtonStatus,
  active,
  settings,
}: PartProps) {
  const partOne = parts[0];
  const partTwo = parts[1];

  React.useEffect(() => {
    if (active && partProgress === 0 && parts.length > 1) {
      setButtonStatus(settings.hideQuestions ? "continue" : "idle");
    }
  }, [
    active,
    partProgress,
    parts.length,
    setButtonStatus,
    settings.hideQuestions,
  ]);

  const showQuestion =
    active && (parts.length > 1 ? partProgress === 1 : partProgress === 0);

  if (settings.hideQuestions) {
    if (parts.length === 1) return null;
    return (
      <FadeIn>
        <TextLine
          element={partOne as StoryElementLine}
          active={active}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
    );
  }

  if (parts.length === 1) {
    if (partOne.type !== "MULTIPLE_CHOICE") return null;
    if (!showQuestion) return null;
    return (
      <FadeIn>
        <MultipleChoiceQuestion
          element={partOne}
          advance={() => setButtonStatus("right")}
        />
      </FadeIn>
    );
  }

  if (partTwo.type !== "MULTIPLE_CHOICE") return null;
  return (
    <>
      <FadeIn>
        <TextLine
          element={partOne as StoryElementLine}
          active={active && partProgress === 0}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
      {showQuestion && (
        <FadeIn>
          <MultipleChoiceQuestion
            element={partTwo}
            advance={() => setButtonStatus("right")}
          />
        </FadeIn>
      )}
    </>
  );
}

function ContinuationPart({
  parts,
  setButtonStatus,
  active,
  settings,
}: PartProps) {
  const [unhide, setUnhide] = React.useState(0);
  const prompt = parts[0] as StoryElementChallengePrompt;
  const line = parts[1] as StoryElementLine;
  const choice = parts[2] as StoryElementMultipleChoice;

  React.useEffect(() => {
    if (active && settings.hideQuestions) setButtonStatus("continue");
  }, [active, setButtonStatus, settings.hideQuestions]);

  if (settings.hideQuestions) {
    return (
      <FadeIn>
        <TextLine
          element={line}
          active={active}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
    );
  }

  return (
    <>
      {active && (
        <FadeIn>
          <QuestionPrompt question={prompt.prompt} lang={prompt.lang} />
        </FadeIn>
      )}
      <FadeIn>
        <TextLine
          element={line}
          active={active}
          unhide={unhide}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
      {active && (
        <FadeIn>
          <MultipleChoiceQuestion
            element={choice}
            advance={() => {
              setUnhide(-1);
              setButtonStatus("right");
            }}
          />
        </FadeIn>
      )}
    </>
  );
}

function SelectPhrasesPart({
  parts,
  setButtonStatus,
  active,
  settings,
}: PartProps) {
  const [unhide, setUnhide] = React.useState(0);
  const prompt = parts[0] as StoryElementChallengePrompt;
  const line = parts[1] as StoryElementLine;
  const question = parts[2] as StoryElementSelectPhrase;

  React.useEffect(() => {
    if (active && settings.hideQuestions) setButtonStatus("continue");
  }, [active, setButtonStatus, settings.hideQuestions]);

  if (settings.hideQuestions) {
    return (
      <FadeIn>
        <TextLine
          element={line}
          active={active}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
    );
  }

  return (
    <>
      {active && (
        <FadeIn>
          <QuestionPrompt question={prompt.prompt} lang={prompt.lang} />
        </FadeIn>
      )}
      <FadeIn>
        <TextLine
          element={line}
          active={active}
          unhide={unhide}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
      {active && (
        <FadeIn>
          <SelectPhraseQuestion
            element={question}
            advance={() => {
              setUnhide(-1);
              setButtonStatus("right");
            }}
          />
        </FadeIn>
      )}
    </>
  );
}

function ArrangePart({ parts, setButtonStatus, active, settings }: PartProps) {
  const [unhide, setUnhide] = React.useState(0);
  const prompt = parts[0] as StoryElementChallengePrompt;
  const line = parts[1] as StoryElementLine;
  const question = parts[2] as StoryElementArrange;

  React.useEffect(() => {
    if (active && settings.hideQuestions) setButtonStatus("continue");
  }, [active, setButtonStatus, settings.hideQuestions]);

  if (settings.hideQuestions || !question) {
    return (
      <FadeIn>
        <TextLine
          element={line}
          active={active}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
    );
  }

  return (
    <>
      {active && (
        <FadeIn>
          <QuestionPrompt question={prompt.prompt} lang={prompt.lang} />
        </FadeIn>
      )}
      <FadeIn>
        <TextLine
          element={line}
          active={active}
          unhide={unhide}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
      {active && (
        <FadeIn>
          <ArrangeQuestion
            element={question}
            advance={(charPosition, done) => {
              setUnhide(charPosition);
              if (done) setButtonStatus("right");
            }}
          />
        </FadeIn>
      )}
    </>
  );
}

function PointToPhrasePart({
  parts,
  partProgress,
  setButtonStatus,
  active,
  settings,
}: PartProps) {
  React.useEffect(() => {
    if (!active) return;
    if (settings.hideQuestions) {
      setButtonStatus("continue");
      return;
    }
    if (partProgress === 0) setButtonStatus("idle");
  }, [active, partProgress, setButtonStatus, settings.hideQuestions]);

  const showQuestion = active && partProgress === 1;
  const line = parts[0] as StoryElementLine;
  const question = parts[1] as StoryElementPointToPhrase;

  if (settings.hideQuestions) {
    return (
      <FadeIn>
        <TextLine
          element={line}
          active={active}
          rtl={settings.rtl}
          autoPlay={settings.audioAutoPlay}
          replayKey={settings.audioReplayKey}
        />
      </FadeIn>
    );
  }

  return (
    <>
      {!showQuestion && (
        <FadeIn>
          <TextLine
            element={line}
            active={active && partProgress === 0}
            rtl={settings.rtl}
            autoPlay={settings.audioAutoPlay}
            replayKey={settings.audioReplayKey}
          />
        </FadeIn>
      )}
      {showQuestion && (
        <FadeIn>
          <PointToPhraseQuestion
            element={question}
            advance={() => setButtonStatus("right")}
          />
        </FadeIn>
      )}
    </>
  );
}

function MatchPart({ parts, setButtonStatus, active, settings }: PartProps) {
  const element = parts[0] as StoryElementMatch;
  if (settings.hideQuestions || !active) {
    // Inactive match challenges leave no trace in the transcript (web parity).
    return null;
  }
  return (
    <FadeIn>
      <MatchQuestion element={element} setDone={() => setButtonStatus("right")} />
    </FadeIn>
  );
}

export function Part(props: PartProps) {
  switch (getPartKind(props.parts)) {
    case "header":
      return <HeaderPart {...props} />;
    case "arrange":
      return <ArrangePart {...props} />;
    case "point-to-phrase":
      return <PointToPhrasePart {...props} />;
    case "multiple-choice":
      return <MultipleChoicePart {...props} />;
    case "continuation":
      return <ContinuationPart {...props} />;
    case "select-phrases":
      return <SelectPhrasesPart {...props} />;
    case "match":
      return <MatchPart {...props} />;
    default:
      return <LinePart {...props} />;
  }
}
