"use client";
"use no memo";

import React from "react";

import { basicSetup, EditorView } from "codemirror";
import { EditorSelection, EditorState } from "@codemirror/state";
import { example, highlightStyle } from "@/components/editor/story/parser";
import useScrollLinking from "@/components/editor/story/scroll_linking";
import useResizeEditor from "@/components/editor/story/editor-resize";
//import {SoundRecorder} from "./sound-recorder";
import StoryEditorPreview from "@/components/StoryEditorPreview";
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
import SoundRecorder from "./sound-recorder";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  insert_audio_line,
  timings_to_text,
} from "@/lib/editor/audio/audio_edit_tools";
import { Avatar, StoryData } from "@/app/editor/story/[story]/types";
import { z } from "zod";

let images_cached: Record<string, z.infer<typeof ImageSchema>> = {};

const ImageSchema = z.object({
  id: z.string(),
  active: z.string(),
  gilded: z.string(),
  locked: z.string(),
  active_lip: z.string(),
  gilded_lip: z.string(),
});

const LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  short: z.string(),
  flag: z.number().nullable(),
  flag_file: z.string().nullable(),
  speaker: z.string().nullable(),
  default_text: z.string(),
  tts_replace: z.string().nullable(),
  public: z.boolean(),
  rtl: z.boolean(),
});
type LanguageData = z.infer<typeof LanguageSchema>;

function getMax<T>(list: T[], callback: (obj: T) => number) {
  let max = -Infinity;
  for (let obj of list) {
    const v = callback(obj);
    if (v > max) max = v;
  }
  return max;
}

type StoryTypeExtended = StoryType & {
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

function toConvexValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => toConvexValue(item));
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = toConvexValue(item);
    }
    return result;
  }
  return value;
}

export type EditorStateType = {
  line_no: number;
  view: EditorView;
  select: (line: string, scroll: boolean) => void;
  audio_insert_lines: AudioInsertLinesType | undefined;
  show_trans: boolean;
  show_audio_editor: (data: StoryElementLine | StoryElementHeader) => void;
  show_ssml: boolean;
};

export default function Editor({
  story_data,
  avatar_names,
}: {
  story_data: StoryData;
  avatar_names: Record<number, Avatar>;
}) {
  const convex = useConvex();
  const setStoryMutation = useMutation(api.storyWrite.setStory);
  const deleteStoryMutation = useMutation(api.storyWrite.deleteStory);
  const editor = React.useRef<HTMLDivElement>(null);
  const preview = React.useRef<HTMLDivElement>(null);
  const margin = React.useRef<SVGSVGElement>(null);
  const svg_parent = React.useRef<SVGSVGElement>(null);

  const language_data =
    (useQuery(api.editorRead.getEditorLanguageByLegacyId, {
      legacyLanguageId: story_data.learning_language,
    }) ?? undefined) as LanguageData | undefined;
  const language_data2 =
    (useQuery(api.editorRead.getEditorLanguageByLegacyId, {
      legacyLanguageId: story_data.from_language,
    }) ?? undefined) as LanguageData | undefined;
  const storyDataRef = React.useRef(story_data);
  const avatarNamesRef = React.useRef(avatar_names);
  const languageDataRef = React.useRef<LanguageData | undefined>(language_data);
  const languageData2Ref = React.useRef<LanguageData | undefined>(language_data2);

  React.useEffect(() => {
    storyDataRef.current = story_data;
  }, [story_data]);

  React.useEffect(() => {
    avatarNamesRef.current = avatar_names;
  }, [avatar_names]);

  React.useEffect(() => {
    languageDataRef.current = language_data;
  }, [language_data]);

  React.useEffect(() => {
    languageData2Ref.current = language_data2;
  }, [language_data2]);

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

  const [func_save, set_func_save] = React.useState(() => async () => {});
  const [func_delete, set_func_delete] = React.useState(() => async () => {});

  const [audio_editor_data, setAudioEditorData] = React.useState<
    StoryElementLine | StoryElementHeader | undefined
  >(undefined);
  //console.log("audio_editor_data", audio_editor_data);

  const [unsaved_changes, set_unsaved_changes] = React.useState(false);

  const [save_error, set_save_error] = React.useState(false);

  const getImage = React.useCallback(
    async (id: string | undefined) => {
      if (!id) return null;
      if (images_cached[id] !== undefined) {
        return images_cached[id];
      }
      try {
        const image = ImageSchema.parse(
          await convex.query(api.editorRead.getEditorImageByLegacyId, {
            legacyImageId: id,
          }),
        );
        images_cached[id] = image;
        return image;
      } catch {
        return undefined;
      }
    },
    [convex],
  );

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
        const currentStoryData = storyDataRef.current;
        if (story_meta === undefined || currentStoryData === undefined) {
          console.error("Save error: story_meta or story_data is undefined");
          return;
        }
        const data = {
          id: currentStoryData.id,
          duo_id: currentStoryData.duo_id,
          name: story_meta.fromLanguageName,
          image: story_meta.icon,
          set_id: story_meta.set_id,
          set_index: story_meta.set_index,
          course_id: currentStoryData.course_id,
          text: editor_text ?? "",
          json: story,
          todo_count: story_meta.todo_count,
        };

        const result = await setStoryMutation({
          legacyStoryId: data.id,
          duo_id: String(data.duo_id ?? ""),
          name: data.name,
          image: data.image ?? "",
          set_id: data.set_id,
          set_index: data.set_index,
          legacyCourseId: data.course_id,
          text: data.text,
          json: toConvexValue(data.json),
          todo_count: data.todo_count,
          change_date: new Date().toISOString(),
          operationKey: `story:${data.id}:set_story:client`,
        });
        if (!result) {
          throw new Error(`Story ${data.id} not found`);
        }
        set_unsaved_changes(false);
      } catch (e) {
        console.error("Save error", e);
        set_save_error(true);
      }
    }
    set_func_save(() => Save);

    async function Delete() {
      const currentStoryData = storyDataRef.current;
      if (story_meta === undefined || currentStoryData === undefined) return;
      const result = await deleteStoryMutation({
        legacyStoryId: currentStoryData.id,
        operationKey: `story:${currentStoryData.id}:delete:client`,
      });
      if (!result) {
        throw new Error(`Story ${currentStoryData.id} not found`);
      }
      navigate(`/editor/course/${currentStoryData.course_id}`);
    }
    set_func_delete(() => Delete);

    async function updateDisplay() {
      const currentStoryData = storyDataRef.current;
      if (stateX === undefined || currentStoryData === undefined) return;
      if (story === undefined) {
        last_lineno = lineno;
        editor_text = stateX.doc.toString();
        const learningLanguage = languageDataRef.current;
        const fromLanguage = languageData2Ref.current;
        const [story2, story_meta2, audio_insert_lines2] = processStoryFile(
          editor_text ?? "",
          currentStoryData.id,
          avatarNamesRef.current,
          {
            learning_language: learningLanguage?.short ?? "",
            from_language: fromLanguage?.short ?? "",
          },
          learningLanguage?.tts_replace ?? "",
        );
        const image = await getImage(story_meta2.icon);
        story = {
          ...story2,
          illustrations: {
            active: image?.active,
            gilded: image?.gilded,
            locked: image?.locked,
          },
          learning_language_rtl: learningLanguage?.rtl ?? false,
          from_language_rtl: fromLanguage?.rtl ?? false,
          from_language: fromLanguage?.short,
          learning_language: learningLanguage?.short,
        };

        story_meta = story_meta2;

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
      doc: storyDataRef.current.text || "",
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
  }, [story_data.id]);

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
      <div id="body" className="flex h-full flex-col">
        {save_error && (
          <>
            <div
              className="fixed inset-0 z-[1999] bg-[rgba(0,0,0,0.5)]"
              onClick={() => set_save_error(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#f44336] p-[10px] text-center text-white">
              There was an error saving.{" "}
              <div
                className="absolute right-[10px] top-0"
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
        <div className="flex h-[100px] grow">
          <svg
            className="pointer-events-none fixed z-[-1] h-full w-full float-left"
            ref={svg_parent}
          >
            <path className="fill-[var(--svg-fill)] stroke-[var(--svg-stroke)]" d=""></path>
          </svg>
          <div
            className={
              "w-[100px] grow [scroll-behavior:auto] max-[975px]:h-[calc((100vh-64px)/2)] max-[975px]:w-full " +
              (language_data?.rtl ? "[direction:rtl]" : "")
            }
            ref={editor}
          ></div>
          <svg
            className="h-[calc(100vh-64px)] w-[2%] cursor-col-resize overflow-scroll float-left"
            ref={margin}
          ></svg>
          <div
            className="w-[100px] grow overflow-scroll [scroll-behavior:auto] max-[975px]:absolute max-[975px]:top-[calc((100vh-64px)/2+64px)] max-[975px]:h-[calc((100vh-64px)/2)] max-[975px]:w-full"
            ref={preview}
          >
            {story_meta && story_data ? (
              <Cast
                id={story_data.id}
                cast={story_meta.cast}
                short={story_data.short}
              />
            ) : null}
            {story_state ? (
              <StoryEditorPreview
                story={story_state}
                editorState={editor_state2}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
