"use client";
import React from "react";
import styles from "../[language].module.css";
import { useInput } from "@/lib/hooks";
import { PlayButton, SpeakerEntry } from "../language_editor";
import { fetch_post } from "@/lib/fetch_post";
import { Layout } from "../language_editor";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import {
  generate_audio_line,
  content_to_audio,
} from "@/components/story/text_lines/audio_edit_tools.mjs";
import TextLine from "@/components/story/text_lines/text_line";
import jsyaml from "js-yaml";

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
  let [data, setData] = React.useState(
    language.tts_replace ||
      `
# line with # are comments and are ignored
      
# here you can add single letters that should be replaced    
#LETTERS:
#    o: u
#    e: i
# here you can add parts of words to be replaced. You can use valid regular expressions (regex) here
FRAGMENTS:
#    ion\\b: flug
#    sem: dem
# whole words that should be replaced
#WORDS:
#    oh: uuuh
#    Worcester: WOO-STER
`,
  );
  function setDataValidated(e) {
    let v = e?.target ? e?.target?.value : e;
    if (v === null || v === undefined) v = "";
    try {
      jsyaml.load(v);
      setData(v);
      setYamlError(false);
    } catch (e) {
      setYamlError(true);
    }
  }
  let [text, setText] = useInput("Enter a text to be spoken");
  let [text2, setText2] = React.useState("");
  let [customSpeaker, setCustomSpeaker] = useInput("");
  const [pitch, setPitch] = React.useState(2);
  const [speed, setSpeed] = React.useState(2);

  let [element, setElement] = React.useState(element_init);

  const [yamlError, setYamlError] = React.useState(false);

  async function save() {
    let d = {
      id: language.id,
      tts_replace: data,
    };
    // test to process the yaml content
    try {
      jsyaml.load(data);
    } catch (e) {
      return;
    }
    let response = await fetch_post(`/editor/language/save_tts_replace`, d);
    if (response.status === 200) return await response.json();
    throw "error";
  }

  async function play2(e, speaker, name) {
    //speaker = `${speaker}(pitch=${["x-low", "low", "medium", "high", "x-high"][pitch]},rate=${["x-slow", "slow", "medium", "fast", "x-fast"][speed]})`;

    let [story, story_meta, audio_insert_lines] = processStoryFile(
      `[DATA]
        icon_0=https://design.duolingo.com/ee58f22644428b8182ae.svg
        speaker_0=${speaker}
        
        [LINE]
        Speaker0: ${text}
        `,
      0,
      {},
      {
        learning_language: "en",
        from_language: "tok2",
      },
      data,
    );
    // nl-NL-FennaNeural(pitch=x-low)
    /*
    let speakText2 = `<prosody pitch="${
        ["x-low", "low", "medium", "high", "x-high"][pitch]
    }" rate="${
        ["x-slow", "slow", "medium", "fast", "x-fast"][speed]
    }">${text2}</prosody>`;
    */
    //let [new_element, mapping, text_clear] = await process();
    //let id = speaker + pitch + speed + name;
    return play(story.elements[0]);
  }

  async function play(new_element) {
    //let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
    //    {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});

    //new_element.line.content.audio.ssml = generate_ssml_line(new_element.line.content.audio.ssml, data, new_element.hideRangesForChallenge)
    setText2(new_element.audio.ssml.text);
    let { keypoints, content } = await generate_audio_line(
      new_element.line.content.audio.ssml,
    );

    let audio = content_to_audio(content);

    //let tt = speakText.replace("$name", name).replace(/<.*?>/g, "");
    element = JSON.parse(JSON.stringify(new_element));
    /*element.line.content = { ...element.line.content };
    element.line.content.text = text_clear;
    element.line.content.lang = language.short;
    element.line.lang = language.short;
     */
    element.audio.keypoints = keypoints;
    element.line.content.audio.keypoints = keypoints;

    //let audioObject = ref.current;
    //audioObject.src = audio.src;
    element.line.content.audio.url = audio.src;
    //element.line.content.audio.url = url
    // {audioStart: 50, rangeEnd: 3}
    setElement(element);

    //audio.play();

    //e.preventDefault();
  }
  async function process() {
    await save();
  }

  //let [audioRange, playAudio, ref, url] = useAudio(element, 1);

  return (
    <>
      <Layout
        language_data={language}
        language2={language2}
        session={session}
        course={course}
        use_edit={true}
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
            <h2>Transcribed Text</h2>
            <span>{text2}</span>
            <h2>Final Text</h2>
            <span className={language.short}>
              <TextLine
                progress={1}
                unhide={true}
                element={element}
                part={[]}
              />
            </span>

            <br />
            <textarea
              defaultValue={data}
              onChange={setDataValidated}
              rows={20}
              cols={40}
              style={{
                width: "100%",
                background: yamlError ? "#ffd4d4" : "none",
              }}
            />
            <br />
            <button onClick={process} disabled={yamlError}>
              save
            </button>
            {yamlError ? (
              <span>The text box does not contain valid yaml syntax.</span>
            ) : (
              <></>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
