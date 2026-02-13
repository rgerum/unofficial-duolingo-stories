"use client";
import React from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import styles from "../[language].module.css";
import { useInput } from "@/lib/hooks";
import { PlayButton, SpeakerEntry } from "../language_editor";
import { Layout } from "../language_editor";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import {
  generate_audio_line,
  content_to_audio,
} from "@/lib/editor/audio/audio_edit_tools";
import StoryTextLine from "@/components/StoryTextLine";
import jsyaml from "js-yaml";
import {
  LanguageType,
  SpeakersType,
  CourseStudType,
} from "@/app/editor/language/[language]/types";
import {
  StoryElement,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";

const element_init: StoryElementLine = {
  trackingProperties: {
    line_index: 0,
  },
  type: "LINE",
  lang: "tok2",
  editor: {},
  line: {
    avatarUrl: "https://design.duolingo.com/ee58f22644428b8182ae.svg",
    characterId: 0,
    type: "CHARACTER",
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

export default function Tts_edit({
  language,
  language2,
  speakers,
  course,
}: {
  language: LanguageType;
  language2: LanguageType | undefined;
  speakers: SpeakersType[];
  course: CourseStudType | undefined;
}) {
  // Render data...                <AvatarNames language={language} speakers={speakers} avatar_names={avatar_names}/>
  const [data, setData] = React.useState(
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
  function setDataValidated(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    try {
      jsyaml.load(v);
      setData(v);
      setYamlError(false);
    } catch (err) {
      setYamlError(true);
    }
  }
  const [text, setText] = useInput("Enter a text to be spoken");
  const [text2, setText2] = React.useState("");
  const [customSpeaker, setCustomSpeaker] = useInput("");
  const [pitch, setPitch] = React.useState(2);
  const [speed, setSpeed] = React.useState(2);

  const [element, setElement] = React.useState(element_init);
  const saveTtsReplaceMutation = useMutation(api.languageWrite.setTtsReplace);

  const [yamlError, setYamlError] = React.useState(false);

  async function save() {
    const d = {
      id: language.id,
      tts_replace: data,
    };
    // test to process the yaml content
    try {
      jsyaml.load(data);
    } catch (e) {
      return;
    }
    return await saveTtsReplaceMutation({
      legacyLanguageId: d.id,
      tts_replace: d.tts_replace,
      operationKey: `language:${d.id}:tts_replace:client`,
    });
  }

  async function play2(e: React.MouseEvent, speaker: string, name: string) {
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

  async function play(new_element: StoryElement) {
    if (new_element.type !== "LINE") return;
    //let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
    //    {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});

    //new_element.line.content.audio.ssml = generate_ssml_line(new_element.line.content.audio.ssml, data, new_element.hideRangesForChallenge)
    if (!new_element.line.content.audio?.ssml?.text) return;
    setText2(new_element.line.content.audio.ssml.text);
    if (!new_element.line.content.audio?.ssml) return;
    let { keypoints, content } = await generate_audio_line(
      new_element.line.content.audio.ssml,
    );

    const audio = content_to_audio(content);

    //let tt = speakText.replace("$name", name).replace(/<.*?>/g, "");
    const element = JSON.parse(JSON.stringify(new_element)) as StoryElementLine;
    /*element.line.content = { ...element.line.content };
    element.line.content.text = text_clear;
    element.line.content.lang = language.short;
    element.line.lang = language.short;
     */
    if (element.audio) element.audio.keypoints = keypoints;
    if (element.line.content.audio)
      element.line.content.audio.keypoints = keypoints;

    //let audioObject = ref.current;
    //audioObject.src = audio.src;
    if (element.line.content.audio) element.line.content.audio.url = audio.src;
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
        course={course}
        use_edit={true}
      >
        <div className={styles.root + " " + styles.characterEditorContent}>
          <div
            className={
              styles.speaker_list +
              " " +
              ((speakers?.length ?? 0) > 0 ? "" : styles.noVoices)
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
                  {speakers?.map((speaker, index) => (
                    <SpeakerEntry
                      key={index}
                      speaker={speaker}
                      play={play2}
                      copyText={() => {}}
                    />
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
              ((speakers?.length ?? 0) > 0 ? "" : styles.noVoices)
            }
            style={{ overflowY: "scroll" }}
          >
            <h2>Input Text</h2>
            <textarea
              defaultValue={text}
              onChange={(e) =>
                setText({
                  target: { value: e.target.value },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              style={{ width: "100%" }}
            />
            <br />
            <h2>Transcribed Text</h2>
            <span>{text2}</span>
            <h2>Final Text</h2>
            <span className={language.short}>
              <StoryTextLine
                active={true}
                unhide={999999}
                element={element}
                settings={{
                  hide_questions: false,
                  show_all: true,
                  show_names: false,
                  rtl: false,
                  highlight_name: [],
                  hideNonHighlighted: false,
                  setHighlightName: () => {},
                  setHideNonHighlighted: () => {},
                  id: 0,
                  show_title_page: false,
                }}
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
