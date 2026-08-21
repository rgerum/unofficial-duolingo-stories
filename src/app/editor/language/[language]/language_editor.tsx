"use client";
"use no memo";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner, SpinnerBlue } from "@/components/ui/spinner";
import { fetch_post } from "@/lib/fetch_post";
import { copyToClipboard } from "@/lib/copy_to_clipboard";

import StoryLineHints from "@/components/StoryLineHints";
import useAudio from "@/components/StoryTextLine/use-audio.hook";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "../../_components/header_context";
import EditorButton from "../../editor_button";
import {
  LanguageType,
  SpeakersType,
  AvatarNamesType,
  CourseStudType,
} from "@/app/editor/language/[language]/types";
import type { StoryElementLine } from "@/components/editor/story/syntax_parser_types";
import {
  type CopyFeedbackStatus,
  CourseVoiceLayout,
  MobileAvatarEditor,
  MobileSpeakerRow,
  type MobileVoiceSection,
} from "./course_voice_layout";
type PlayFn = (
  e: React.MouseEvent,
  text: string,
  name: string,
) => Promise<void>;

export default function LanguageEditor({
  identifier,
  renderHeader = true,
  mobileCourseLayout = false,
}: {
  identifier: string;
  renderHeader?: boolean;
  mobileCourseLayout?: boolean;
}) {
  const resolved = useQuery(api.editorRead.resolveEditorLanguage, {
    identifier,
  });

  const speakers = useQuery(
    api.editorRead.getEditorSpeakersByLanguageLegacyId,
    resolved?.language ? { languageLegacyId: resolved.language.id } : "skip",
  );

  const avatarNames = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    resolved?.language ? { languageLegacyId: resolved.language.id } : "skip",
  );

  if (
    resolved === undefined ||
    speakers === undefined ||
    avatarNames === undefined
  ) {
    return <Spinner />;
  }

  if (!resolved?.language) {
    return <p>Language not found.</p>;
  }

  const language = resolved.language as LanguageType;
  const language2 = (resolved.language2 ?? undefined) as
    | LanguageType
    | undefined;
  const course = (resolved.course ?? undefined) as CourseStudType | undefined;

  // Render data...
  return (
    <>
      <Layout
        language_data={language}
        language2={language2}
        course={course}
        use_edit={false}
        renderHeader={renderHeader}
      >
        <div
          className={
            mobileCourseLayout
              ? "leading-normal"
              : "flex flex-col leading-normal min-[560px]:flex-row max-[600px]:block"
          }
        >
          <AvatarNames
            language={language}
            speakers={(speakers ?? []) as SpeakersType[]}
            avatar_names={(avatarNames ?? []) as AvatarNamesType[]}
            mobileCourseLayout={mobileCourseLayout}
          />
        </div>
      </Layout>
    </>
  );
}

export function Layout({
  children,
  language_data,
  language2,
  course,
  use_edit,
  renderHeader = true,
}: {
  children: React.ReactNode;
  language_data: LanguageType;
  language2: LanguageType | undefined;
  course: CourseStudType | undefined;
  use_edit: boolean;
  renderHeader?: boolean;
}) {
  /*
    <CourseDropdown userdata={userdata} />
    <Login userdata={userdata} />
    */
  //const { userdata, error } = useSWR('https://test.duostories.org/stories/backend_node_test/session', fetch)

  //if (error) return <div>failed to load</div>
  //if (!userdata) return <div>loading...</div>
  let crumbs;
  if (use_edit) {
    crumbs = [
      { type: "Editor", href: `/editor` },
      { type: "sep" },
      {
        type: "course",
        lang1: language_data,
        lang2: language2,
        href: course?.short ? `/editor/course/${course?.short}` : `/editor`,
      },
      { type: "sep" },
      {
        type: "Voices",
        href: course?.short
          ? `/editor/language/${course?.short}`
          : `/editor/language/${language_data?.short}`,
      },
      { type: "sep" },
      { type: "Edit" },
    ];
  } else {
    crumbs = [
      { type: "Editor", href: `/editor` },
      { type: "sep" },
      {
        type: "course",
        lang1: language_data,
        lang2: language2,
        href: course?.short ? `/editor/course/${course?.short}` : `/editor`,
      },
      { type: "sep" },
      { type: "Voices" },
    ];
  }
  return (
    <>
      {renderHeader ? (
        <>
          <EditorHeaderBreadcrumbs>
            <Breadcrumbs path={crumbs} />
          </EditorHeaderBreadcrumbs>
          <EditorHeaderActions>
            {use_edit ? null : (
              <EditorButton
                id="button_edit"
                href={`/editor/course/${
                  course?.short || language_data.short
                }/voices/edit`}
                data-cy="button_edit"
                img={"import.svg"}
                text={"Edit"}
              />
            )}
          </EditorHeaderActions>
        </>
      ) : null}
      <div>{children}</div>
    </>
  );
} //                 <Login page={"editor"}/>

// The card renders rows from buildAvatarRows verbatim; reuse the shared row
// type so the editor stays in sync with backend changes.
type AvatarData = AvatarNamesType;

function GenderMark({ gender }: { gender: "male" | "female" | null }) {
  if (!gender) return null;
  return (
    <span className="ml-1 opacity-60" title={gender}>
      {gender === "female" ? "♀" : "♂"}
    </span>
  );
}

// Placeholder for the name input when this language has no name set yet:
// suggest the canonical (English) name, or the names this avatar has in
// specific stories (it is reused for different characters across stories).
function namePlaceholder(avatar: AvatarData) {
  if (avatar.canonical_name) return avatar.canonical_name;
  const suggestions = avatar.story_name_suggestions;
  if (suggestions.length === 0) return "Name";
  const shown = suggestions.slice(0, 2).join("/");
  return suggestions.length > 2 ? `${shown}/…` : shown;
}

function Avatar(props: {
  avatar: AvatarData;
  language_id: LanguageType;
  play: PlayFn;
  mobileCourseLayout: boolean;
}) {
  const avatar = props.avatar;
  const placeholderName = namePlaceholder(avatar);
  // Only the name set for this language is the input's value; canonical and
  // per-story names are shown as placeholder suggestions instead.
  const languageName = avatar.language_name;
  const [savedName, setSavedName] = useState(languageName || "");
  const [savedSpeaker, setSavedSpeaker] = useState(avatar.speaker || "");
  const [inputName, inputNameSetValue] = useState(savedName);
  const [inputSpeaker, inputSpeakerSetValue] = useState(savedSpeaker);

  const unsavedChanged =
    inputName !== savedName || inputSpeaker !== savedSpeaker;

  React.useEffect(() => {
    // Keep UI in sync with reactive Convex updates while preserving local edits.
    if (unsavedChanged) return;
    const nextSavedName = languageName || "";
    const nextSavedSpeaker = avatar.speaker || "";
    setSavedName(nextSavedName);
    setSavedSpeaker(nextSavedSpeaker);
    inputNameSetValue(nextSavedName);
    inputSpeakerSetValue(nextSavedSpeaker);
  }, [languageName, avatar.speaker, unsavedChanged]);

  const language_id = props.language_id;
  const saveAvatarSpeakerMutation = useMutation(
    api.languageWrite.setAvatarSpeaker,
  );
  async function save() {
    const name = inputName;
    const speaker = inputSpeaker;
    const data = {
      name: name,
      speaker: speaker,
      language_id: language_id.id,
      avatar_id: avatar.avatar_id,
    };
    await saveAvatarSpeakerMutation({
      legacyLanguageId: data.language_id,
      legacyAvatarId: data.avatar_id,
      name: data.name,
      speaker: data.speaker,
      operationKey: `avatar_mapping:${data.language_id}:${data.avatar_id}:client`,
    });
    setSavedName(name);
    setSavedSpeaker(speaker);
  }

  const desktopCardClassName =
    "m-[10px] flex flex-col items-center rounded-[5px] border border-[var(--header-border)] p-[5px] max-[600px]:m-0" +
    (props.mobileCourseLayout ? " max-[975px]:hidden" : "");
  const mobileCard = props.mobileCourseLayout ? (
    <MobileAvatarEditor
      avatarId={avatar.avatar_id}
      avatarUrl={avatar.link}
      displayName={inputName || placeholderName}
      placeholderName={placeholderName}
      inputName={inputName}
      inputSpeaker={inputSpeaker}
      unsaved={unsavedChanged}
      nameMode={
        avatar.avatar_id === -1
          ? "read-only"
          : avatar.avatar_id === 0
            ? "disabled"
            : "editable"
      }
      playControl={
        <PlayButton
          play={props.play}
          speaker={inputSpeaker}
          largeTouchTarget
          name={
            avatar.avatar_id === 0
              ? "Duo"
              : inputName || avatar.canonical_name || ""
          }
        />
      }
      onNameChange={inputNameSetValue}
      onSpeakerChange={inputSpeakerSetValue}
      onSave={() => void save()}
    />
  ) : null;

  if (avatar.avatar_id === -1) {
    return (
      <>
        {mobileCard}
        <div className={desktopCardClassName}>
          <p className="m-0">
            {avatar.avatar_id}
            <GenderMark gender={avatar.gender} />
            <span>{unsavedChanged ? "*" : ""}</span>
          </p>
          <p className="m-0 h-[50px]">
            <img
              alt="avatar"
              src={avatar.link}
              style={{ height: "50px" }}
              title={placeholderName}
            />
          </p>

          <p className="m-0">{inputName}</p>
          <p className="m-0">
            <input
              className="w-[102px] rounded-[5px] border border-[var(--input-border)] bg-[var(--input-background)] p-[5px] text-[var(--text-color)]"
              value={inputSpeaker}
              onChange={(e) => inputSpeakerSetValue(e.target.value)}
              type="text"
              placeholder="Speaker"
            />
          </p>
          <span
            className="inline-flex cursor-pointer items-center justify-center pr-[5px]"
            title="play audio"
            onClick={(e) => props.play(e, inputSpeaker, "Duo")}
          >
            <img
              className="w-5"
              alt="play"
              src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
            />
          </span>
          <p className="m-0">
            <input
              className="mt-[6px] cursor-pointer rounded-[8px] border border-[var(--input-border)] bg-[var(--input-background)] px-[10px] py-[4px] text-[var(--text-color)] disabled:cursor-default disabled:opacity-70"
              value="save"
              onClick={save}
              disabled={!unsavedChanged}
              type="button"
            />
          </p>
        </div>
      </>
    );
  }
  return (
    <>
      {mobileCard}
      <div className={desktopCardClassName}>
        <p className="m-0">
          {avatar.avatar_id}
          <GenderMark gender={avatar.gender} />
          <span>{unsavedChanged ? "*" : ""}</span>
        </p>
        <p className="m-0">
          <img
            alt="avatar"
            src={avatar.link}
            style={{ height: "50px" }}
            title={placeholderName}
          />
        </p>

        <p className="m-0">{inputName}</p>
        <p className="m-0">
          <input
            className="w-[102px] rounded-[5px] border border-[var(--input-border)] bg-[var(--input-background)] p-[5px] text-[var(--text-color)]"
            value={inputSpeaker}
            onChange={(e) => inputSpeakerSetValue(e.target.value)}
            type="text"
            placeholder="Speaker"
          />
        </p>

        <PlayButton
          play={props.play}
          speaker={inputSpeaker}
          name={
            avatar.avatar_id === 0
              ? "Duo"
              : inputName || avatar.canonical_name || ""
          }
        />
        <p className="m-0">
          <input
            value="save"
            className="mt-[6px] cursor-pointer rounded-[8px] border border-[var(--input-border)] bg-[var(--input-background)] px-[10px] py-[4px] text-[var(--text-color)] disabled:cursor-default disabled:opacity-70"
            onClick={save}
            disabled={!unsavedChanged}
            type="button"
          />
        </p>
      </div>
    </>
  );
}

interface PlayButtonProps {
  play: PlayFn;
  speaker: string | null;
  name: string;
  largeTouchTarget?: boolean;
}

export function PlayButton(props: PlayButtonProps) {
  let play = props.play;
  let speaker = props.speaker;
  let name = props.name;

  let [loading, setLoading] = useState(0);

  async function do_play(e: React.MouseEvent, text: string, name: string) {
    e.preventDefault();
    setLoading(1);
    try {
      await play(e, text, name);
    } catch (e) {
      console.error(e);
      return setLoading(-1);
    }
    setLoading(0);
  }

  const content =
    loading === 0 ? (
      <img
        className="h-5 w-5"
        alt="play"
        src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
      />
    ) : loading === 1 ? (
      <SpinnerBlue />
    ) : loading === -1 ? (
      <img
        title="an error occurred"
        alt="error"
        src="/editor/icons/error.svg"
      />
    ) : null;

  if (props.largeTouchTarget) {
    return (
      <button
        type="button"
        aria-label="Play voice sample"
        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
        title="play audio"
        onClick={(event) => do_play(event, speaker || "", name)}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center"
      title="play audio"
      onClick={(event) => do_play(event, speaker || "", name)}
    >
      {content}
    </span>
  );
}

export function SpeakerEntry(props: {
  speaker: SpeakersType;
  copyText: (
    e: React.MouseEvent,
    text: string,
  ) => void | Promise<Exclude<CopyFeedbackStatus, "idle">>;
  copyStatus?: CopyFeedbackStatus;
  play: PlayFn;
  mobileLayout?: boolean;
}) {
  const speaker = props.speaker;
  const copyText = props.copyText;
  const mobileLayout = props.mobileLayout ?? false;

  return (
    <>
      {mobileLayout ? (
        <MobileSpeakerRow
          speaker={speaker}
          playControl={
            <PlayButton
              play={props.play}
              speaker={speaker.speaker}
              name="Duo"
              largeTouchTarget
            />
          }
          onCopy={(event) => copyText(event, speaker.speaker)}
          copyStatus={props.copyStatus ?? "idle"}
        />
      ) : null}
      <tr className={mobileLayout ? "max-[975px]:hidden" : undefined}>
        <td className="flex items-center gap-1.5 whitespace-nowrap">
          <PlayButton play={props.play} speaker={speaker.speaker} name="Duo" />
          <span className="mr-[3px] rounded bg-[var(--editor-ssml)] px-[5px] py-[2px] text-[0.8em]">
            {speaker.speaker}
          </span>
          <span
            className="inline-flex cursor-pointer items-center justify-center"
            title="copy to clipboard"
            onClick={(event) => {
              void Promise.resolve(copyText(event, speaker.speaker)).then(
                (status) => {
                  if (status === "error") {
                    window.alert("Could not copy the voice name.");
                  }
                },
              );
            }}
          >
            <img className="w-5" alt="copy" src="/editor/icons/copy.svg" />
          </span>
        </td>
        <td>{speaker.gender}</td>
        <td>{speaker.type}</td>
      </tr>
    </>
  );
}

const element_init: StoryElementLine = {
  type: "LINE",
  lang: "",
  trackingProperties: {
    line_index: 0,
  },
  editor: {},
  line: {
    type: "CHARACTER",
    characterId: 0,
    content: {
      hintMap: [],
      text: "",
      audio: {
        ssml: {
          text: "<speak>Jan is thuis met  zijn vrouw, Marian.</speak>",
          speaker: "nl-NL-FennaNeural(pitch=x-low)",
          id: 43,
          inser_index: 1,
          plan_text: "Jan is thuis met  zijn vrouw, Marian.",
          plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
        },
        url: "audio/xx.mp3",
        keypoints: [],
      },
    },
  },
};
function AvatarNames({
  language,
  speakers,
  avatar_names,
  mobileCourseLayout,
}: {
  language: LanguageType;
  speakers: SpeakersType[];
  avatar_names: AvatarNamesType[];
  mobileCourseLayout: boolean;
}) {
  let [speakText, setSpeakText] = useState("");
  const [speakTextDefault, setSpeakTextDefault] = useState(
    language.default_text,
  );
  const [stored, setStored] = useState<Record<string, HTMLAudioElement>>({});

  const [pitch, setPitch] = useState(2);
  const [speed, setSpeed] = useState(2);
  const [mobileSection, setMobileSection] =
    useState<MobileVoiceSection>("cast");
  const [showSecondaryCast, setShowSecondaryCast] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    speaker: string;
    status: Exclude<CopyFeedbackStatus, "idle">;
  } | null>(null);
  const copyFeedbackTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const copyAttempt = React.useRef(0);
  const saveDefaultTextMutation = useMutation(api.languageWrite.setDefaultText);

  let [element, setElement] = useState(element_init);

  React.useEffect(
    () => () => {
      copyAttempt.current += 1;
      if (copyFeedbackTimer.current !== null) {
        clearTimeout(copyFeedbackTimer.current);
      }
    },
    [],
  );

  function showCopyFeedback(
    speaker: string,
    status: Exclude<CopyFeedbackStatus, "idle">,
  ) {
    if (copyFeedbackTimer.current !== null) {
      clearTimeout(copyFeedbackTimer.current);
    }
    setCopyFeedback({ speaker, status });
    copyFeedbackTimer.current = setTimeout(() => {
      setCopyFeedback(null);
      copyFeedbackTimer.current = null;
    }, 1500);
  }

  async function copyText(e: React.MouseEvent, text: string) {
    const speaker = text;
    const attempt = ++copyAttempt.current;
    let p = ["x-low", "low", "medium", "high", "x-high"][pitch];
    let s = ["x-slow", "slow", "medium", "fast", "x-fast"][speed];
    if (pitch !== 2 && speed !== 2) text = `${text}(pitch=${p}, rate=${s})`;
    else if (pitch !== 2 && speed === 2) text = `${text}(pitch=${p})`;
    else if (pitch === 2 && speed !== 2) text = `${text}(rate=${s})`;

    e.preventDefault();
    setCopyFeedback(null);
    try {
      await copyToClipboard(text);
      if (attempt === copyAttempt.current) {
        showCopyFeedback(speaker, "copied");
      }
      return "copied" as const;
    } catch (error) {
      console.error("Could not copy voice name", error);
      if (attempt === copyAttempt.current) {
        showCopyFeedback(speaker, "error");
      }
      return "error" as const;
    }
  }

  async function saveText() {
    try {
      await saveDefaultTextMutation({
        legacyLanguageId: language.id,
        default_text: speakText,
        operationKey: `language:${language.id}:default_text:client`,
      });
      setSpeakTextDefault(speakText);
    } catch (e) {
      window.alert("could not be saved");
    }
  }

  if (speakText === "")
    speakText = language?.default_text || "My name is $name.";

  function setTestPhrase(value: string) {
    setStored({});
    setSpeakText(value);
  }

  let images = [];
  let avatars_new = [];
  let avatars_new_important = [];
  if (avatar_names !== undefined)
    for (let avatar of avatar_names) {
      if (images.indexOf(avatar.link) === -1) {
        if (
          [0, 414, 415, 416, 418, 507, 508, 509, 592, 593].indexOf(
            avatar.avatar_id,
          ) !== -1
        )
          avatars_new_important.push(avatar);
        else avatars_new.push(avatar);
        images.push(avatar.link);
      }
    }

  async function play2(e: React.MouseEvent, text: string, name: string) {
    let speakText2 = `<prosody pitch="${
      ["x-low", "low", "medium", "high", "x-high"][pitch]
    }" rate="${
      ["x-slow", "slow", "medium", "fast", "x-fast"][speed]
    }">${speakText}</prosody>`;
    let id = text + pitch + speed + name;
    return play(e, id, text, name, speakText2);
  }

  async function play3(e: React.MouseEvent, text: string, name: string) {
    text = text.trim();
    let match = text.match(/([^(]*)\((.*)\)/);
    let speakText2 = speakText;
    if (match) {
      text = match[1];
      let attributes = "";
      for (let part of match[2].matchAll(/(\w*)=([\w-]*)/g)) {
        attributes += ` ${part[1]}="${part[2]}"`;
      }
      speakText2 = `<prosody ${attributes}>${speakText}</prosody>`;
    }

    let id = text + pitch + speed + name;
    return play(e, id, text, name, speakText2);
  }

  async function play(
    e: React.MouseEvent,
    id: string,
    text: string,
    name: string,
    speakText: string,
  ) {
    if (stored[id] === undefined) {
      //let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
      //    {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});
      let response2 = await fetch_post(`/audio/create`, {
        id: 0,
        speaker: text,
        text: speakText.replace("$name", name),
      });
      let ssml_response = await response2.json();

      let binaryString = window.atob(ssml_response.content);
      let binaryData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }
      let blob = new Blob([binaryData], { type: "audio/mp3" });
      let url = URL.createObjectURL(blob);
      let audio = new Audio();
      audio.src = url;
      stored[id] = audio;

      let tt = speakText.replace("$name", name).replace(/<.*?>/g, "");
      element = { ...element };
      element.line.content = { ...element.line.content };
      element.line.content.text = tt;
      element.line.content.audio.keypoints = [];
      let audioObject = ref.current;
      if (audioObject) audioObject.src = url;
      //element.line.content.audio.url = url
      // {audioStart: 50, rangeEnd: 3}
      let last_pos = 0;
      for (let marks of ssml_response.marks || []) {
        last_pos += tt.substring(last_pos).indexOf(marks.value);
        element.line.content.audio.keypoints.push({
          audioStart: marks.time,
          rangeEnd: last_pos,
        });
      }
      setElement(element);

      //stored[id] = new Audio("https://carex.uber.space/stories/audio/" + ssml_response["output_file"] + "?"+Math.random());
      setStored(stored);
    }
    let audio = stored[id];
    audio.play();

    e.preventDefault();
  }

  let [audioRange, playAudio, ref, url] = useAudio(element, true);

  return (
    <CourseVoiceLayout
      mobileCourseLayout={mobileCourseLayout}
      selectedSection={mobileSection}
      onSectionSelect={setMobileSection}
      test={{
        audioElement: (
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
        ),
        hints: (
          <StoryLineHints
            audioRange={audioRange}
            content={element.line.content}
          />
        ),
        phrase: speakText,
        phraseChanged: speakText !== speakTextDefault,
        pitch,
        speed,
        onPhraseChange: setTestPhrase,
        onSavePhrase: () => void saveText(),
        onPitchChange: setPitch,
        onSpeedChange: setSpeed,
        onReplay: playAudio,
      }}
      voices={{
        rows: speakers.map((speaker) => (
          <SpeakerEntry
            key={speaker.id}
            copyText={copyText}
            speaker={speaker}
            play={play2}
            mobileLayout={mobileCourseLayout}
            copyStatus={
              copyFeedback?.speaker === speaker.speaker
                ? copyFeedback.status
                : "idle"
            }
          />
        )),
      }}
      cast={{
        mainRows: avatars_new_important.map((avatar) => (
          <Avatar
            key={avatar.avatar_id}
            play={play3}
            language_id={language}
            avatar={avatar}
            mobileCourseLayout={mobileCourseLayout}
          />
        )),
        secondaryRows: avatars_new.map((avatar) => (
          <Avatar
            key={avatar.avatar_id}
            play={play3}
            language_id={language}
            avatar={avatar}
            mobileCourseLayout={mobileCourseLayout}
          />
        )),
        secondaryCount: avatars_new.length,
        secondaryExpanded: showSecondaryCast,
        onToggleSecondary: () => setShowSecondaryCast((visible) => !visible),
      }}
    />
  );
}
