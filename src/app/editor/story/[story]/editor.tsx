"use client";
"use no memo";
import styles from "./[story].module.css";

import React from "react";

import { basicSetup, EditorView } from "codemirror";
import { EditorSelection, EditorState } from "@codemirror/state";
import { example, highlightStyle } from "@/components/editor/story/parser";
import useScrollLinking from "@/components/editor/story/scroll_linking";
import useResizeEditor from "@/components/editor/story/editor-resize";
//import {SoundRecorder} from "./sound-recorder";
import Story, { EditorContext } from "@/components/story/story";
import Cast from "@/components/editor/story/cast";

import {
  processStoryFile,
  StoryType,
} from "@/components/editor/story/syntax_parser_new";
import {
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";

import { useRouter } from "next/navigation";
import { StoryEditorHeader } from "./header";
import { fetch_post } from "@/lib/fetch_post";
import SoundRecorder from "./sound-recorder";
import {
  insert_audio_line,
  timings_to_text,
} from "@/components/story/text_lines/audio_edit_tools";
import { Avatar, StoryData } from "@/app/editor/story/[story]/page";
import { z } from "zod";

let images_cached: Record<string, z.infer<typeof ImageSchema>> = {};
export async function getImage(id: string | undefined) {
  if (!id) return null;
  if (images_cached[id] !== undefined) {
    return images_cached[id];
  }
  return await getImageAsync(id);
  //return {}
}

const ImageSchema = z.object({
  id: z.string(),
  active: z.string(),
  gilded: z.string(),
  locked: z.string(),
  active_lip: z.string(),
  gilded_lip: z.string(),
});

export async function getImageAsync(id: string) {
  try {
    let response_json = await fetch(`/editor/story/get_image/${id}`, {
      credentials: "include",
    });
    const image = ImageSchema.parse(await response_json.json());
    images_cached[id] = image;
    return image;
  } catch (e) {
    return undefined;
  }
}

const LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  short: z.string(),
  flag: z.number(),
  flag_file: z.string(),
  speaker: z.string(),
  default_text: z.string(),
  tts_replace: z.string(),
  public: z.boolean(),
  rtl: z.boolean(),
});
type LanguageData = z.infer<typeof LanguageSchema>;
export async function getLanguageName(id: number) {
  try {
    let response = await fetch(`/editor/story/get_language/${id}`, {
      credentials: "include",
    });
    console.log("getLanguageName", id, await response.json());
    return LanguageSchema.parse(await response.json());
  } catch (e) {
    return undefined;
  }
}

export async function setStory(data: {
  id: number;
  duo_id: number;
  name: string;
  image: string | undefined;
  set_id: number;
  set_index: number;
  course_id: number;
  text: string;
  json: StoryTypeExtended | undefined;
  todo_count: number;
}) {
  const res = await fetch_post(`/editor/story/set_story`, data);
  return await res.text();
}

export async function deleteStory(data: {
  id: number;
  course_id: number;
  text: string | undefined;
  name: string | undefined;
}) {
  let res = await fetch_post(`/editor/story/delete_story`, data);
  return await res.text();
}

function getMax<T>(list: T[], callback: (obj: T) => number) {
  let max = -Infinity;
  for (let obj of list) {
    const v = callback(obj);
    if (v > max) max = v;
  }
  return max;
}

export type StoryTypeExtended = StoryType & {
  illustrations: {
    active: string | undefined;
    gilded: string | undefined;
    locked: string | undefined;
  };
  learning_language_rtl: boolean;
  from_language_rtl: boolean;
  learning_language: string | undefined;
  from_language: string | undefined;
};

type StoryMetaType = ReturnType<typeof processStoryFile>[1];

type AudioInsertLinesType = ReturnType<typeof processStoryFile>[2];

export type EditorStateType = {
  line_no: number;
  view: EditorView;
  select: (line: string, scroll: boolean) => void;
  audio_insert_lines: AudioInsertLinesType | undefined;
  show_trans: boolean;
  show_audio_editor: (data: any) => void;
  show_ssml: boolean;
};

export default function Editor({
  story_data,
  avatar_names,
}: {
  story_data: StoryData;
  avatar_names: Record<number, Avatar>;
}) {
  const editor = React.useRef<HTMLDivElement>(null);
  const preview = React.useRef<HTMLDivElement>(null);
  const margin = React.useRef<SVGSVGElement>(null);
  const svg_parent = React.useRef<SVGSVGElement>(null);

  const [language_data, set_language_data] = React.useState<
    LanguageData | undefined
  >();
  const [language_data2, set_language_data2] = React.useState<
    LanguageData | undefined
  >();
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
  const [show_ssml, set_show_ssml] = React.useState(false);

  const [editor_state, set_editor_state] = React.useState<
    EditorStateType | undefined
  >();
  const [story_state, set_story_state] = React.useState<
    StoryTypeExtended | undefined
  >();
  const [story_meta, set_story_meta] = React.useState<
    StoryMetaType | undefined
  >();
  const [view, set_view] = React.useState<EditorView | undefined>();

  const [func_save, set_func_save] = React.useState(() => () => {});
  const [func_delete, set_func_delete] = React.useState(() => () => {});

  const [audio_editor_data, setAudioEditorData] = React.useState<
    StoryElementLine | StoryElementHeader | undefined
  >(undefined);
  console.log("audio_editor_data", audio_editor_data);

  const [unsaved_changes, set_unsaved_changes] = React.useState(false);

  const [save_error, set_save_error] = React.useState(false);

  function soundRecorderNext() {
    if (!story_state) return;
    const index = audio_editor_data?.trackingProperties.line_index || 0;
    for (let element of story_state.elements) {
      if (
        element.type === "LINE" &&
        (element.trackingProperties?.line_index ?? 0) > index
      ) {
        setAudioEditorData(element);
        break;
      }
    }
  }
  function soundRecorderPrevious() {
    if (!story_state) return;
    const index = audio_editor_data?.trackingProperties.line_index || 0;
    for (let element of [...story_state.elements].reverse()) {
      if (
        (element.type === "LINE" || element.type === "HEADER") &&
        (element.trackingProperties?.line_index ?? 0) < index
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
    (event: BeforeUnloadEvent) => {
      if (unsaved_changes) {
        event.preventDefault();
        return (event.returnValue =
          "You have unsaved changed, are you sure you want to quit?");
      }
    },
    [unsaved_changes],
  );

  const onAudioSave = (filename: string, text: string) => {
    text = "$" + filename + text;

    if (!audio_editor_data?.audio || !editor_state) return;
    if (!editor_state.audio_insert_lines) return;
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
  }, [unsaved_changes, beforeunload]);

  React.useEffect(() => {
    if (!story_data || !avatar_names) return undefined;
    let createScrollLookUp = () => {
      window.dispatchEvent(new CustomEvent("resize"));
    };

    let story: StoryTypeExtended | undefined = undefined;
    let story_meta: StoryMetaType | undefined = undefined;
    let audio_insert_lines: AudioInsertLinesType | undefined = undefined;
    let last_lineno: number | undefined = undefined;
    let lineno: number | undefined = undefined;
    let editor_state: EditorStateType | undefined = undefined;
    let stateX: EditorState | undefined = undefined;
    let editor_text: string | undefined = undefined;

    async function Save() {
      try {
        if (story_meta === undefined || story_data === undefined) return;
        let data = {
          id: story_data.id,
          duo_id: story_data.duo_id,
          name: story_meta.fromLanguageName,
          image: story_meta.icon,
          set_id: story_meta.set_id,
          set_index: story_meta.set_index,
          course_id: story_data.course_id,
          text: editor_text ?? "",
          json: story,
          todo_count: story_meta.todo_count,
        };

        await setStory(data);
        set_unsaved_changes(false);
      } catch (e) {
        set_save_error(true);
      }
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
        const [story2, story_meta2, audio_insert_lines2] = processStoryFile(
          editor_text ?? "",
          story_data.id,
          avatar_names,
          {
            learning_language: language_data?.short ?? "",
            from_language: language_data2?.short ?? "",
          },
          language_data?.tts_replace ?? "",
        );
        const image = await getImage(story_meta2.icon);
        story = {
          ...story2,
          illustrations: {
            active: image?.active,
            gilded: image?.gilded,
            locked: image?.locked,
          },
          learning_language_rtl: language_data?.rtl ?? false,
          from_language_rtl: language_data2?.rtl ?? false,
          from_language: language_data2?.short,
          learning_language: language_data?.short,
        };

        if (editor_state)
          set_editor_state({
            ...editor_state,
            audio_insert_lines: audio_insert_lines2,
          });
        set_story_state(story);
        set_story_meta(story_meta2);
        audio_insert_lines = audio_insert_lines2;

        createScrollLookUp();
        last_lineno = lineno;
      }
    }

    window.setInterval(updateDisplay, 1000);

    let last_event_lineno: number | undefined;
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
        select: (line: string, scroll: boolean) => {
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
        show_ssml: show_ssml,
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
    const view = new EditorView({ state, parent: editor.current ?? undefined });
    set_view(view);

    async function key_pressed(e: KeyboardEvent) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story_data, avatar_names, language_data, language_data2]);

  //             <!--<div id="toolbar">--!
  //<nav className={styles.header_index}>
  let editor_state2 = editor_state ? { ...editor_state } : undefined;
  if (editor_state2) {
    editor_state2.show_trans = show_trans;
    editor_state2.show_ssml = show_ssml;
  }

  const audio_editor_data_content =
    (audio_editor_data?.type == "LINE" && audio_editor_data.line.content) ||
    (audio_editor_data?.type == "HEADER" &&
      audio_editor_data.learningLanguageTitleContent);

  return (
    <>
      <div id="body" className={styles.body}>
        {save_error && (
          <>
            <div
              className={styles.error_modal_background}
              onClick={() => set_save_error(false)}
            />
            <div className={styles.save_error}>
              There was an error saving.{" "}
              <div
                className={styles.close}
                onClick={() => set_save_error(false)}
              >
                X
              </div>
            </div>
          </>
        )}
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
        {story_state &&
          audio_editor_data &&
          audio_editor_data.audio &&
          audio_editor_data_content && (
            <SoundRecorder
              key={audio_editor_data.trackingProperties.line_index}
              content={audio_editor_data_content}
              initialTimingText={timings_to_text({
                filename: audio_editor_data.audio.url ?? "",
                keypoints: audio_editor_data.audio.keypoints ?? [],
              })}
              url={
                "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/" +
                audio_editor_data.audio.url
              }
              story_id={story_data.id}
              onClose={() => setAudioEditorData(undefined)}
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
                cast={story_meta.cast}
                short={story_data.short}
              />
            ) : null}
            {story_state ? (
              <EditorContext.Provider value={editor_state2}>
                <Story editor={editor_state} story={story_state} />
              </EditorContext.Provider>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
