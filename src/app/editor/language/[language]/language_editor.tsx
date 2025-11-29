"use client";
import React, { useState } from "react";
import { useInput } from "@/lib/hooks";
import { SpinnerBlue } from "@/components/layout/spinner";
import { fetch_post } from "@/lib/fetch_post";
import styles from "./[language].module.css";

import AudioPlay from "@/components/story/text_lines/audio_play";
import HintLineContent from "@/components/story/text_lines/line_hints";
import useAudio from "@/components/story/text_lines/use_audio";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import EditorButton from "../../editor_button";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";
import {
  LanguageType,
  SpeakersType,
  AvatarNamesType,
  CourseStudSchema,
} from "@/app/editor/language/[language]/queries";

export default function LanguageEditor({
  language,
  language2,
  speakers,
  avatar_names,
  course,
}: {
  language: LanguageType;
  language2: LanguageType | undefined;
  speakers: SpeakersType[];
  avatar_names: AvatarNamesType[];
  course: CourseStudSchema | undefined;
}) {
  // Render data...
  return (
    <>
      <Layout
        language_data={language}
        language2={language2}
        course={course}
        use_edit={false}
      >
        <div className={styles.root + " " + styles.characterEditorContent}>
          <AvatarNames
            language={language}
            speakers={speakers}
            avatar_names={avatar_names}
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
  course: CourseStudSchema | undefined;
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
      <nav className={styles.header_index}>
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
      <div className={styles.main_index}>{children}</div>
    </>
  );
} //                 <Login page={"editor"}/>

export async function setAvatarSpeaker(data: {
  name: string;
  speaker: string;
  language_id: number;
  avatar_id: number;
}) {
  let response = await fetch_post(`/editor/language/set_avatar_speaker`, data);
  if (response.status === 200) return await response.json();
  throw "error";
}

export async function setDefaultText(data: {
  id: number;
  default_text: string;
}) {
  let response = await fetch_post(`/editor/language/set_default_text`, data);
  if (response.status === 200) return await response.json();
  throw "error";
}

function Avatar(props: {
  avatar: {
    name: string;
    speaker: string;
    language_id: number;
    avatar_id: number;
  };
  language_id: {
    id: number;
    name: string;
    short: string;
  };
}) {
  const avatar = props.avatar;
  const [name, setName] = useState(avatar.name);
  const [speaker, setSpeaker] = useState(avatar.speaker);
  const [inputName, inputNameSetValue] = useState(name || "");
  const [inputSpeaker, inputSpeakerSetValue] = useState(speaker || "");

  const unsavedChanged =
    inputName !== (name || "") || inputSpeaker !== (speaker || "");

  const language_id = props.language_id;
  async function save() {
    const name = inputName;
    const speaker = inputSpeaker;
    const data = {
      name: name,
      speaker: speaker,
      language_id: language_id.id,
      avatar_id: avatar.avatar_id,
    };
    await setAvatarSpeaker(data);
    setName(name);
    setSpeaker(speaker);
  }
  if (avatar.avatar_id === -1) {
    return (
      <div className={styles.avatar}>
        <p>
          {avatar.avatar_id}
          <span>{unsavedChanged ? "*" : ""}</span>
        </p>
        <p style={{ height: "50px" }}>
          <img alt="avatar" src={avatar.link} style={{ height: "50px" }} />
        </p>

        <p>{inputName}</p>
        <p>
          <input
            value={inputSpeaker}
            onChange={(e) => inputSpeakerSetValue(e.target.value)}
            type="text"
            placeholder="Speaker"
          />
        </p>
        <span
          className={styles.copy_button}
          title="play audio"
          onClick={(e) => props.play(e, inputSpeaker, "Duo")}
        >
          <img
            alt="play"
            src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
          />
        </span>
        <p>
          <input
            className={styles.saveBtn}
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
    <div className={styles.avatar}>
      <p>
        {avatar.avatar_id}
        <span>{unsavedChanged ? "*" : ""}</span>
      </p>
      <p>
        <img alt="avatar" src={avatar.link} style={{ height: "50px" }} />
      </p>

      <p>
        <input
          value={inputName}
          disabled={avatar.avatar_id === 0}
          onChange={(e) => inputNameSetValue(e.target.value)}
          type="text"
          placeholder="Name"
        />
      </p>
      <p>
        <input
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
      <p>
        <input
          value="save"
          className={styles.saveBtn}
          onClick={save}
          disabled={!unsavedChanged}
          type="button"
        />
      </p>
    </div>
  );
}

export function PlayButton(props) {
  let play = props.play;
  let speaker = props.speaker;
  let name = props.name;

  let [loading, setLoading] = useState(0);

  async function do_play(e, text, name) {
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
      className={styles.play_button}
      title="play audio"
      onClick={(e) => do_play(e, speaker, name)}
    >
      {loading === 0 ? (
        <img
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
  play: (e: React.MouseEvent, text: string, name: string) => void;
}) {
  const speaker = props.speaker;
  const copyText = props.copyText;

  return (
    <tr>
      <td className={styles.speakerEntryCopy}>
        <PlayButton play={props.play} speaker={speaker.speaker} name="Duo" />
        <span className={styles.ssml_speaker}>{speaker.speaker}</span>
        <span
          className={styles.copy_button}
          title="copy to clipboard"
          onClick={(e) => copyText(e, speaker.speaker)}
        >
          <img alt="copy" src="/editor/icons/copy.svg" />
        </span>
      </td>
      <td>{speaker.gender}</td>
      <td>{speaker.type}</td>
    </tr>
  );
}

const element_init = {
  trackingProperties: {
    line: 0,
  },
  line: {
    content: {
      hintMap: [],
      hints: [],
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
  const [stored, setStored] = useState({});

  const [pitch, setPitch] = useState(2);
  const [speed, setSpeed] = useState(2);

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
      await setDefaultText({ default_text: speakText, id: language.id });
      setSpeakTextDefault(speakText);
    } catch (e) {
      window.alert("could not be saved");
    }
  }

  if (speakText === "")
    speakText = language?.default_text || "My name is $name.";

  function doSetSpeakText(event: React.ChangeEvent<HTMLInputElement>) {
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

  async function play2(e, text: string, name: string) {
    let speakText2 = `<prosody pitch="${
      ["x-low", "low", "medium", "high", "x-high"][pitch]
    }" rate="${
      ["x-slow", "slow", "medium", "fast", "x-fast"][speed]
    }">${speakText}</prosody>`;
    let id = text + pitch + speed + name;
    return play(e, id, text, name, speakText2);
  }

  async function play3(e, text: string, name: string) {
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

  async function play(e, id, text, name, speakText) {
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
      audioObject.src = url;
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

  let [audioRange, playAudio, ref, url] = useAudio(element, 1);

  //if(avatars === undefined || speakers === undefined || language === undefined)
  //    return <Spinner/>
  return (
    <>
      <div
        className={
          styles.speaker_list +
          " " +
          (speakers?.length > 0 ? "" : styles.noVoices)
        }
      >
        <audio ref={ref}>
          <source src={url} type="audio/mp3" />
        </audio>
        <AudioPlay onClick={playAudio} />
        <HintLineContent
          audioRange={audioRange}
          content={element.line.content}
        />

        <div>
          <textarea
            className={styles.textarea}
            value={speakText}
            onChange={doSetSpeakText}
            style={{ width: "100%" }}
          />
          <input
            className={styles.saveBtn}
            value={"save" + (speakText !== speakTextDefault ? "*" : "")}
            onClick={saveText}
            disabled={speakText === speakTextDefault}
            type="button"
          />
        </div>

        <div className={styles.slidecontainer}>
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
        <div className={styles.slidecontainer}>
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
        <div className={styles.tablecontainer}>
          <table
            className={styles.story_list + " " + styles.voice_list}
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
          styles.avatar_editor +
          " " +
          (speakers?.length > 0 ? "" : styles.noVoices)
        }
        style={{ overflowY: "scroll" }}
      >
        <p>
          These characters are the default cast of duolingo. Their names should
          be kept as close to the original as possible.
        </p>
        <div className={styles.avatar_editor_group} data-cy="avatar_list1">
          {avatars_new_important.map((avatar, index) => (
            <Avatar
              key={index}
              play={play3}
              language_id={language}
              avatar={avatar}
            />
          ))}
        </div>
        <p>These characters just appear in a couple of stories.</p>
        <div className={styles.avatar_editor_group} data-cy="avatar_list2">
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
