"use client";
import styles from "../[language].module.css";
import React, { useState } from "react";
import { transcribe_text } from "lib/editor/tts_transcripte.mjs";
import { useInput } from "lib/hooks";
import { PlayButton, SpeakerEntry } from "../language_editor";
import { fetch_post } from "lib/fetch_post";
import { Layout } from "../language_editor";
import HintLineContent from "../../../../../components/story/text_lines/line_hints";
import AudioPlay from "../../../../../components/story/text_lines/audio_play";
import useAudio from "../../../../../components/story/text_lines/use_audio";

let element_init = {
  trackingProperties: {
    line: 0,
  },
  type: "LINE",
  lang: "tok2",
  line: {
    avatarUrl: "https://design.duolingo.com/ee58f22644428b8182ae.svg",
    characterId: "0",
    type: "CHARACTER",
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

export default function Tts_edit({
  language,
  language2,
  speakers,
  session,
  course,
}) {
  // Render data...                <AvatarNames language={language} speakers={speakers} avatar_names={avatar_names}/>
  let [data, setData] = useInput(
    language.tts_replace ||
      `
# here you can add single letters that should be replaced    
LETTERS:
    o: u
    e: i
# here you can add parts of words to be replaced. You can use valid regular expressions (regex) here
FRAGMENTS:
    ion\\b: flug
    sem: dem
# whole words that should be replaced
WORDS:
    oh: uuuh
    Worcester: WOO-STER
`,
  );
  let [text, setText] = useInput("Enter a text to be spoken");
  let [text2, setText2] = React.useState("");
  let [customSpeaker, setCustomSpeaker] = useInput("");
  const [pitch, setPitch] = useState(2);
  const [speed, setSpeed] = useState(2);

  let [element, setElement] = useState(element_init);

  async function save() {
    let d = {
      id: language.id,
      tts_replace: data,
    };
    let response = await fetch_post(`/editor/language/save_tts_replace`, d);
    if (response.status === 200) return await response.json();
    throw "error";
  }

  async function play2(e, speaker, name) {
    let [text2, mapping, text_clear] = await process();
    let speakText2 = `<prosody pitch="${
      ["x-low", "low", "medium", "high", "x-high"][pitch]
    }" rate="${
      ["x-slow", "slow", "medium", "fast", "x-fast"][speed]
    }">${text2}</prosody>`;
    let id = speaker + pitch + speed + name;
    return play(e, id, speaker, name, speakText2, mapping, text_clear);
  }

  async function play(e, id, speaker, name, speakText, mapping, text_clear) {
    //let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
    //    {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});
    let response2 = await fetch_post(`/audio/create`, {
      id: 0,
      speaker: speaker,
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

    let tt = speakText.replace("$name", name).replace(/<.*?>/g, "");
    element = JSON.parse(JSON.stringify(element));
    element.line.content = { ...element.line.content };
    element.line.content.text = text_clear;
    element.line.content.lang = language.short;
    element.line.lang = language.short;
    element.line.content.audio.keypoints = [];
    let audioObject = ref.current;
    audioObject.src = url;
    //element.line.content.audio.url = url
    // {audioStart: 50, rangeEnd: 3}
    let last_pos = 0;
    for (let marks of ssml_response.marks) {
      last_pos += tt.substring(last_pos).indexOf(marks.value);
      element.line.content.audio.keypoints.push({
        audioStart: marks.time,
        rangeEnd: mapping[last_pos],
      });
    }
    setElement(element);

    audio.play();

    e.preventDefault();
  }
  async function process() {
    await save();
    let text_clear = text
      .replace(/\\n/g, "\n")
      .replace(/~/g, " ")
      .replace(/]]/g, "]")
      .replace(/\[\[/g, "[");
    let [text2, mapping] = transcribe_text(text, data);
    setText2(text2);
    return [text2, mapping, text_clear];
  }

  let [audioRange, playAudio, ref, url] = useAudio(element, 1);

  return (
    <>
      <Layout
        language_data={language}
        language2={language2}
        session={session}
        course={course}
      >
        <div className={styles.root + " " + styles.characterEditorContent}>
          <div
            className={
              styles.speaker_list +
              " " +
              (speakers?.length > 0 ? "" : styles.noVoices)
            }
          >
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
                    <SpeakerEntry key={index} speaker={speaker} play={play2} />
                  ))}
                  <tr>
                    <td>
                      <PlayButton
                        play={play2}
                        speaker={customSpeaker}
                        name="Duo"
                      />
                      <input
                        value={customSpeaker}
                        onChange={setCustomSpeaker}
                      />
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
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
            <h2>Input Text</h2>
            <textarea
              defaultValue={text}
              onChange={setText}
              style={{ width: "100%" }}
            />
            <br />
            <button onClick={process}>Process</button>
            <br />
            <h2>Transcribed Text</h2>
            <span>{text2}</span>
            <h2>Final Text</h2>
            <audio ref={ref}>
              <source src={url} type="audio/mp3" />
            </audio>
            <AudioPlay onClick={playAudio} />
            <span className={language.short}>
              <HintLineContent
                audioRange={audioRange}
                content={element.line.content}
              />
            </span>

            <br />
            <textarea
              defaultValue={data}
              onChange={setData}
              rows={20}
              cols={40}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Layout>
    </>
  );
}
