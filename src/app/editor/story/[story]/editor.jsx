"use client";
import styles from "./[story].module.css";

import React from "react";

import { basicSetup, EditorView } from "codemirror";
import { EditorSelection, EditorState } from "@codemirror/state";
import { example, highlightStyle } from "@/components/editor/story/parser.mjs";
import useScrollLinking from "@/components/editor/story/scroll_linking";
import useResizeEditor from "@/components/editor/story/editor-resize";
//import {SoundRecorder} from "./sound-recorder";
import Story, { EditorContext } from "@/components/story/story";
import Cast from "@/components/editor/story/cast";

import { processStoryFile } from "@/components/editor/story/syntax_parser_new";

import { useRouter } from "next/navigation";
import { StoryEditorHeader } from "./header";
import { fetch_post } from "@/lib/fetch_post";
import SoundRecorder from "./sound-recorder";
import {
  insert_audio_line,
  timings_to_text,
} from "@/components/story/text_lines/audio_edit_tools.mjs";

let images_cached = {};
export async function getImage(id) {
  if (images_cached[id] !== undefined) {
    return images_cached[id];
  }
  return await getImageAsync(id);
  //return {}
}

export async function getImageAsync(id) {
  try {
    let response_json = await fetch(`/editor/story/get_image/${id}`, {
      credentials: "include",
    });
    let image = await response_json.json();
    images_cached[id] = image;
    return image;
  } catch (e) {
    return {};
  }
}

export async function getLanguageName(id) {
  try {
    let response = await fetch(`/editor/story/get_language/${id}`, {
      credentials: "include",
    });
    return await response.json();
  } catch (e) {
    return {};
  }
}

export async function setStory(data) {
  let res = await fetch_post(`/editor/story/set_story`, data);
  res = await res.text();
  return res;
}

export async function deleteStory(data) {
  let res = await fetch_post(`/editor/story/delete_story`, data);
  res = await res.text();
  return res;
}

function getMax(list, callback) {
  let max = -Infinity;
  for (let obj of list) {
    const v = callback(obj);
    if (v > max) max = v;
  }
  return max;
}

export default function Editor({ story_data, avatar_names }) {
  const editor = React.useRef();
  const preview = React.useRef();
  const margin = React.useRef();
  const svg_parent = React.useRef();

  const [language_data, set_language_data] = React.useState();
  const [language_data2, set_language_data2] = React.useState();
  React.useEffect(() => {
    async function loadLanguageData() {
      if (!story_data) return () => {};
      let language_data = await getLanguageName(story_data.learning_language);
      let language_data2 = await getLanguageName(story_data.from_language);
      set_language_data(language_data);
      set_language_data2(language_data2);
      return () => {};
    }
    loadLanguageData();
  }, [story_data]);

  const [show_trans, set_show_trans] = React.useState(false);
  const [show_ssml, set_show_ssml] = React.useState();

  const [editor_state, set_editor_state] = React.useState();
  const [story_state, set_story_state] = React.useState();
  const [story_meta, set_story_meta] = React.useState();
  const [view, set_view] = React.useState();

  const [func_save, set_func_save] = React.useState(() => () => {});
  const [func_delete, set_func_delete] = React.useState(() => () => {});

  const [audio_editor_data, setAudioEditorData] = React.useState({});

  const [unsaved_changes, set_unsaved_changes] = React.useState(false);

  function soundRecorderNext() {
    const index = audio_editor_data.trackingProperties.line_index || 0;
    for (let element of story_state.elements) {
      if (
        element.type === "LINE" &&
        element.trackingProperties.line_index > index
      ) {
        setAudioEditorData(element);
        break;
      }
    }
  }
  function soundRecorderPrevious() {
    const index = audio_editor_data.trackingProperties.line_index || 0;
    for (let element of [...story_state.elements].reverse()) {
      if (
        (element.type === "LINE" || element.type === "HEADER") &&
        (element.trackingProperties.line_index || 0) < index
      ) {
        setAudioEditorData(element);
        break;
      }
    }
  }

  const navigate = useRouter().push;

  useResizeEditor(editor.current, preview.current, margin.current);
  useScrollLinking(view, preview.current, svg_parent.current);

  let beforeunload = React.useCallback(
    (event) => {
      if (unsaved_changes) {
        event.preventDefault();
        return (event.returnValue =
          "You have unsaved changed, are you sure you want to quit?");
      }
    },
    [unsaved_changes],
  );

  const onAudioSave = (filename, text) => {
    text = "$" + filename + text;

    insert_audio_line(
      text,
      audio_editor_data.audio.ssml,
      editor_state.view,
      editor_state.audio_insert_lines,
    );
  };

  React.useEffect(() => {
    if (!unsaved_changes) return;
    window.addEventListener("beforeunload", beforeunload);
    return () => window.removeEventListener("beforeunload", beforeunload);
  }, [unsaved_changes]);

  React.useEffect(() => {
    if (!story_data || !avatar_names) return undefined;
    let createScrollLookUp = () => {
      window.dispatchEvent(new CustomEvent("resize"));
    };

    let story = undefined;
    let story_meta = undefined;
    let audio_insert_lines = undefined;
    let last_lineno = undefined;
    let lineno = undefined;
    let editor_state = undefined;
    let stateX = undefined;
    let editor_text = undefined;

    async function Save() {
      if (story_meta === undefined || story_data === undefined) return;
      let data = {
        id: story_data.id,
        duo_id: story_data.duo_id,
        name: story_meta.fromLanguageName,
        image: story_meta.icon,
        set_id: parseInt(story_meta.set_id),
        set_index: parseInt(story_meta.set_index),
        course_id: story_data.course_id,
        text: editor_text,
        json: story,
        todo_count: story_meta.todo_count,
      };

      await setStory(data);
      set_unsaved_changes(false);
    }
    set_func_save(() => Save);

    async function Delete() {
      if (story_meta === undefined || story_data === undefined) return;
      await deleteStory({
        id: story_data.id,
        course_id: story_data.course_id,
        text: editor_text,
        name: story_meta.from_language_name,
      });
      await navigate(`/editor/course/${story_data.course_id}`);
    }
    set_func_delete(() => Delete);

    async function updateDisplay() {
      if (stateX === undefined || story_data === undefined) return;
      if (story === undefined) {
        last_lineno = lineno;
        editor_text = stateX.doc.toString();
        [story, story_meta, audio_insert_lines] = processStoryFile(
          editor_text,
          story_data.id,
          avatar_names,
          {
            learning_language: language_data?.short,
            from_language: language_data2?.short,
          },
          language_data?.tts_replace,
        );
        let image = await getImage(story_meta.icon);
        story.illustrations = {
          active: image.active,
          gilded: image.gilded,
          locked: image.locked,
        };
        story.learning_language_rtl = language_data?.rtl;
        story.from_language_rtl = language_data2?.rtl;

        set_editor_state({ ...editor_state, audio_insert_lines });
        set_story_state(story);
        set_story_meta(story_meta);

        createScrollLookUp();
        last_lineno = lineno;
      }
    }

    window.setInterval(updateDisplay, 1000);

    let last_event_lineno;
    let sync = EditorView.updateListener.of((v) => {
      lineno = v.state.doc.lineAt(v.state.selection.ranges[0].from).number;
      if (last_event_lineno !== lineno) {
        last_event_lineno = lineno;
        const event = new CustomEvent("editorLineChanged", {
          detail: {
            lineno: lineno,
          },
        });

        window.dispatchEvent(event);
      }

      editor_state = {
        line_no: lineno,
        view: view,
        select: (line, scroll) => {
          let pos = view.state.doc.line(parseInt(line)).from;
          view.dispatch(
            view.state.update({
              selection: EditorSelection.cursor(pos),
              scrollIntoView: scroll,
            }),
          );
        },
        audio_insert_lines: audio_insert_lines,
        show_trans: show_trans,
        show_audio_editor: setAudioEditorData,
      };
      stateX = v.state;
      if (v.docChanged) {
        set_unsaved_changes(true);
        story = undefined;
        last_lineno = undefined;
      }
    });

    let theme = EditorView.theme({
      ".cm-here": { color: "darkorange" },
      ".cm-name": { color: "orange" },
      ".cm-invalid": { color: "green" },
    });

    const state = EditorState.create({
      doc: story_data.text || "",
      extensions: [basicSetup, sync, theme, example(), highlightStyle],
    });
    const view = new EditorView({ state, parent: editor.current });
    set_view(view);

    async function key_pressed(e) {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        await Save();
      }
    }
    document.addEventListener("keydown", key_pressed);

    return () => {
      view.destroy();
      document.removeEventListener("keydown", key_pressed);
    };
  }, [story_data, avatar_names, language_data, language_data2]);

  //             <!--<div id="toolbar">--!
  //<nav className={styles.header_index}>
  let editor_state2 = { ...editor_state };
  editor_state2.show_trans = show_trans;
  editor_state2.show_ssml = show_ssml;
  return (
    <>
      <div id="body" className={styles.body}>
        <StoryEditorHeader
          story_data={story_data}
          unsaved_changes={unsaved_changes}
          func_save={func_save}
          func_delete={func_delete}
          show_trans={show_trans}
          set_show_trans={set_show_trans}
          show_ssml={show_ssml}
          set_show_ssml={set_show_ssml}
          language_data={language_data}
          language_data2={language_data2}
        />
        {(audio_editor_data?.line?.content ||
          audio_editor_data?.learningLanguageTitleContent) && (
          <SoundRecorder
            key={audio_editor_data.trackingProperties.line_index}
            content={
              audio_editor_data?.line?.content ||
              audio_editor_data?.learningLanguageTitleContent
            }
            initialTimingText={timings_to_text({
              keypoints: audio_editor_data.audio.keypoints,
            })}
            url={
              "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/" +
              audio_editor_data.audio.url
            }
            story_id={story_data.id}
            onClose={() => setAudioEditorData(null)}
            onSave={onAudioSave}
            soundRecorderNext={soundRecorderNext}
            soundRecorderPrevious={soundRecorderPrevious}
            total_index={getMax(
              story_state.elements,
              (elem) => elem.trackingProperties.line_index || 0,
            )}
            current_index={
              audio_editor_data?.trackingProperties?.line_index || 0
            }
          />
        )}
        <div className={styles.root}>
          <svg className={styles.margin} ref={svg_parent}>
            <path d=""></path>
          </svg>
          <div
            className={
              styles.editor +
              " " +
              (language_data?.rtl ? styles.editor_rtl : "")
            }
            ref={editor}
          ></div>
          <svg className={styles.margin2} ref={margin}></svg>
          <div className={styles.preview} ref={preview}>
            {story_meta && story_data ? (
              <Cast
                id={story_data.id}
                story_meta={story_meta}
                learning_language={story_data.learning_language}
                short={story_data.short}
              />
            ) : null}
            {story_state ? (
              <EditorContext.Provider value={editor_state2}>
                <Story
                  editor={editor_state}
                  story={story_state}
                  navigate={navigate}
                />
              </EditorContext.Provider>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
