"use client";
"use no memo";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner, SpinnerBlue } from "@/components/ui/spinner";
import { fetch_post } from "@/lib/fetch_post";

import PlayAudio from "@/components/PlayAudio";
import StoryLineHints from "@/components/StoryLineHints";
import useAudio from "@/components/StoryTextLine/use-audio.hook";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import EditorButton from "../../editor_button";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";
import {
  LanguageType,
  SpeakersType,
  AvatarNamesType,
  CourseStudType,
} from "@/app/editor/language/[language]/types";
import type { StoryElementLine } from "@/components/editor/story/syntax_parser_types";
type PlayFn = (
  e: React.MouseEvent,
  text: string,
  name: string,
) => Promise<void>;

export default function LanguageEditor({ identifier }: { identifier: string }) {
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
      >
        <div className="flex flex-col leading-normal min-[560px]:flex-row max-[600px]:block">
          <AvatarNames
            language={language}
            speakers={(speakers ?? []) as SpeakersType[]}
            avatar_names={(avatarNames ?? []) as AvatarNamesType[]}
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
}: {
  children: React.ReactNode;
  language_data: LanguageType;
  language2: LanguageType | undefined;
  course: CourseStudType | undefined;
  use_edit: boolean;
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
      <nav className="fixed top-0 z-[1] box-border flex h-[60px] w-full items-center border-b-2 border-[var(--header-border)] bg-[var(--body-background)] px-5">
        <Breadcrumbs path={crumbs} />
        <div style={{ marginLeft: "auto" }}></div>
        {use_edit ? (
          <></>
        ) : (
          <EditorButton
            id="button_edit"
            href={`/editor/language/${
              course?.short || language_data.short
            }/tts_edit`}
            data-cy="button_edit"
            img={"import.svg"}
            text={"Edit"}
          />
        )}
        <LoggedInButtonWrappedClient
          page={"editor"}
          course_id={course?.short}
        />
      </nav>
      <div className="mt-[60px]">{children}</div>
    </>
  );
} //                 <Login page={"editor"}/>

interface AvatarData {
  name: string | null;
  speaker: string | null;
  language_id: number | null;
  avatar_id: number;
  link: string;
}

function Avatar(props: {
  avatar: AvatarData;
  language_id: LanguageType;
  play: PlayFn;
}) {
  const avatar = props.avatar;
  const [savedName, setSavedName] = useState(avatar.name || "");
  const [savedSpeaker, setSavedSpeaker] = useState(avatar.speaker || "");
  const [inputName, inputNameSetValue] = useState(savedName);
  const [inputSpeaker, inputSpeakerSetValue] = useState(savedSpeaker);

  const unsavedChanged =
    inputName !== savedName || inputSpeaker !== savedSpeaker;

  React.useEffect(() => {
    // Keep UI in sync with reactive Convex updates while preserving local edits.
    if (unsavedChanged) return;
    const nextSavedName = avatar.name || "";
    const nextSavedSpeaker = avatar.speaker || "";
    setSavedName(nextSavedName);
    setSavedSpeaker(nextSavedSpeaker);
    inputNameSetValue(nextSavedName);
    inputSpeakerSetValue(nextSavedSpeaker);
  }, [avatar.name, avatar.speaker, unsavedChanged]);

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
  if (avatar.avatar_id === -1) {
    return (
      <div className="m-[10px] flex flex-col items-center rounded-[5px] border border-[var(--header-border)] p-[5px] max-[600px]:m-0">
        <p className="m-0">
          {avatar.avatar_id}
          <span>{unsavedChanged ? "*" : ""}</span>
        </p>
        <p className="m-0 h-[50px]">
          <img alt="avatar" src={avatar.link} style={{ height: "50px" }} />
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
    );
  }
  return (
    <div className="m-[10px] flex flex-col items-center rounded-[5px] border border-[var(--header-border)] p-[5px] max-[600px]:m-0">
      <p className="m-0">
        {avatar.avatar_id}
        <span>{unsavedChanged ? "*" : ""}</span>
      </p>
      <p className="m-0">
        <img alt="avatar" src={avatar.link} style={{ height: "50px" }} />
      </p>

      <p className="m-0">
        <input
          className="w-[102px] rounded-[5px] border border-[var(--input-border)] bg-[var(--input-background)] p-[5px] text-[var(--text-color)]"
          value={inputName}
          disabled={avatar.avatar_id === 0}
          onChange={(e) => inputNameSetValue(e.target.value)}
          type="text"
          placeholder="Name"
        />
      </p>
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
        name={avatar.avatar_id === 0 ? "Duo" : inputName}
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
  );
}

interface PlayButtonProps {
  play: PlayFn;
  speaker: string | null;
  name: string;
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

  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center"
      title="play audio"
      onClick={(e) => do_play(e, speaker || "", name)}
    >
      {loading === 0 ? (
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
      ) : (
        <></>
      )}
    </span>
  );
}

export function SpeakerEntry(props: {
  speaker: SpeakersType;
  copyText: (e: React.MouseEvent, text: string) => void;
  play: PlayFn;
}) {
  const speaker = props.speaker;
  const copyText = props.copyText;

  return (
    <tr>
      <td className="flex items-center gap-1.5 whitespace-nowrap">
        <PlayButton play={props.play} speaker={speaker.speaker} name="Duo" />
        <span className="mr-[3px] rounded bg-[var(--editor-ssml)] px-[5px] py-[2px] text-[0.8em]">
          {speaker.speaker}
        </span>
        <span
          className="inline-flex cursor-pointer items-center justify-center"
          title="copy to clipboard"
          onClick={(e) => copyText(e, speaker.speaker)}
        >
          <img className="w-5" alt="copy" src="/editor/icons/copy.svg" />
        </span>
      </td>
      <td>{speaker.gender}</td>
      <td>{speaker.type}</td>
    </tr>
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
}: {
  language: LanguageType;
  speakers: SpeakersType[];
  avatar_names: AvatarNamesType[];
}) {
  let [speakText, setSpeakText] = useState("");
  const [speakTextDefault, setSpeakTextDefault] = useState(
    language.default_text,
  );
  const [stored, setStored] = useState<Record<string, HTMLAudioElement>>({});

  const [pitch, setPitch] = useState(2);
  const [speed, setSpeed] = useState(2);
  const saveDefaultTextMutation = useMutation(api.languageWrite.setDefaultText);

  let [element, setElement] = useState(element_init);

  function copyText(e: React.MouseEvent, text: string) {
    let p = ["x-low", "low", "medium", "high", "x-high"][pitch];
    let s = ["x-slow", "slow", "medium", "fast", "x-fast"][speed];
    if (pitch !== 2 && speed !== 2) text = `${text}(pitch=${p}, rate=${s})`;
    else if (pitch !== 2 && speed === 2) text = `${text}(pitch=${p})`;
    else if (pitch === 2 && speed !== 2) text = `${text}(rate=${s})`;

    e.preventDefault();
    return navigator.clipboard.writeText(text);
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

  function doSetSpeakText(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setStored({});
    setSpeakText(event.target.value);
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

  //if(avatars === undefined || speakers === undefined || language === undefined)
  //    return <Spinner/>
  return (
    <>
      <div
        className={
          "h-[calc(100vh-64px)] w-full overflow-y-scroll max-[600px]:h-auto min-[560px]:w-[400px] " +
          (speakers?.length > 0 ? "" : "hidden")
        }
      >
        <audio ref={ref}>
          <source src={url} type="audio/mp3" />
        </audio>
        <PlayAudio onClick={playAudio} />
        <StoryLineHints
          audioRange={audioRange}
          content={element.line.content}
        />
        <div>
          <textarea
            className="w-full rounded-[5px] border border-[var(--input-border)] bg-[var(--input-background)] text-[var(--text-color)]"
            value={speakText}
            onChange={doSetSpeakText}
          />
          <input
            className="mt-[6px] cursor-pointer rounded-[8px] border border-[var(--input-border)] bg-[var(--input-background)] px-[10px] py-[4px] text-[var(--text-color)] disabled:cursor-default disabled:opacity-70"
            value={"save" + (speakText !== speakTextDefault ? "*" : "")}
            onClick={saveText}
            disabled={speakText === speakTextDefault}
            type="button"
          />
        </div>
        <div className="mt-2">
          Pitch:{" "}
          <input
            type="range"
            min="0"
            max="4"
            value={pitch}
            id="pitch"
            onChange={(e) => setPitch(parseInt(e.target.value))}
          />
        </div>
        <div className="mt-2">
          Speed:{" "}
          <input
            type="range"
            min="0"
            max="4"
            value={speed}
            id="speed"
            onChange={(e) => setSpeed(parseInt(e.target.value))}
          />
        </div>
        <div className="h-[calc(100%-110px)] overflow-y-scroll max-[600px]:h-[calc(50vh-140px)]">
          <table
            className="mt-4 w-full border-collapse [&_td]:px-[6px] [&_td]:py-[6px] [&_td]:leading-[1.25] [&_th]:sticky [&_th]:top-0 [&_th]:bg-[var(--button-background)] [&_th]:px-2 [&_th]:py-[5px] [&_th]:text-left [&_th]:font-bold [&_th]:leading-[1.25] [&_th]:text-[var(--button-color)] [&_tr:nth-child(2n)]:bg-[var(--body-background-faint)]"
            data-cy="voice_list"
            data-js-sort-table="true"
          >
            <thead>
              <tr>
                <th
                  style={{ borderRadius: "10px 0 0 0" }}
                  data-js-sort-colnum="0"
                >
                  Name
                </th>
                <th data-js-sort-colnum="1">Gender</th>
                <th
                  style={{ borderRadius: "0 10px 0 0" }}
                  data-js-sort-colnum="2"
                >
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {speakers.map((speaker, index) => (
                <SpeakerEntry
                  key={index}
                  copyText={copyText}
                  speaker={speaker}
                  play={play2}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div
        className={
          "ml-2 h-[calc(100vh-64px)] w-full overflow-y-scroll max-[600px]:m-0 max-[600px]:h-[calc(50vh-30px)] " +
          (speakers?.length > 0
            ? "min-[560px]:w-[calc(100vw-400px)]"
            : "hidden")
        }
      >
        <p className="my-4">
          These characters are the default cast of duolingo. Their names should
          be kept as close to the original as possible.
        </p>
        <div
          className="flex flex-wrap gap-[5px] p-[5px] min-[601px]:gap-0 min-[601px]:p-0"
          data-cy="avatar_list1"
        >
          {avatars_new_important.map((avatar, index) => (
            <Avatar
              key={index}
              play={play3}
              language_id={language}
              avatar={avatar}
            />
          ))}
        </div>
        <p className="my-4">
          These characters just appear in a couple of stories.
        </p>
        <div
          className="flex flex-wrap gap-[5px] p-[5px] min-[601px]:gap-0 min-[601px]:p-0"
          data-cy="avatar_list2"
        >
          {avatars_new.map((avatar, index) => (
            <Avatar
              key={index}
              play={play3}
              language_id={language}
              avatar={avatar}
            />
          ))}
        </div>
      </div>
    </>
  );
}
