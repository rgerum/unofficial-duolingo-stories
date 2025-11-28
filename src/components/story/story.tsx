"use client";
import React, { useEffect, useState } from "react";
import styles from "./story.module.css";

import Part from "./part";
import FinishedPage from "./layout/finish_page";
import Footer from "./layout/story_footer";
import StoryHeader from "./layout/story_header";
import Legal from "../layout/legal";
import { StoryTitlePage } from "./layout/story_title_page";
import {
  EditorStateType,
  StoryTypeExtended,
} from "@/app/editor/story/[story]/editor";
import { StoryElement } from "@/components/editor/story/syntax_parser_types";
import { useRouter } from "next/navigation";
import { LocalisationFunc } from "@/lib/get_localisation_func";

export const StoryContext = React.createContext({});
export const EditorContext = React.createContext<EditorStateType | undefined>(
  undefined,
);

export default function Story({
  story,
  id,
  editor,
  storyFinishedIndexUpdate,
  auto_play,
  hide_questions,
  localization,
}: {
  story: StoryTypeExtended;
  id?: number;
  editor?: EditorStateType | undefined;
  storyFinishedIndexUpdate?: (id: number) => Promise<void>;
  auto_play?: boolean;
  hide_questions?: boolean;
  localization?: LocalisationFunc;
}) {
  console.log("Story", story);
  const router = useRouter();

  const storyElement = React.useRef<HTMLDivElement>(null);
  const mainElement = React.useRef<HTMLDivElement>(null);

  let course = story.learning_language + "-" + story.from_language;

  let [progress, setProgress] = useState(editor ? -2 : -1);
  let [right, setRight] = useState(false);
  let [blocked, setBlocked] = useState(false);
  let [progressStep, setProgressStep] = useState(1);

  let [audio_loaded, setAudioLoaded] = useState(0);

  let [show_title_page, setShowTitlePage] = useState(0);

  let ref_audio1 = React.useRef<HTMLAudioElement>(null);
  let ref_audio2 = React.useRef<HTMLAudioElement>(null);
  let ref_audio3 = React.useRef<HTMLAudioElement>(null);

  const wrong = React.useCallback(() => {
    ref_audio2.current?.play();
  }, [ref_audio2]);

  const right_call = React.useCallback(() => {
    ref_audio1.current?.play();
    setRight(true);
    setBlocked(false);
  }, [ref_audio1, setRight, setBlocked]);

  const audio_failed_call = React.useCallback(() => {
    if (show_title_page === 0 || progress === -1) {
      setShowTitlePage(1);
      setProgress(-2);
    }
  }, [show_title_page, progress, setShowTitlePage, setProgress]);

  function block_next() {
    if (!controls.hide_questions) setBlocked(true);
  }

  let advance_progress = React.useCallback(
    (current_progress?: number | undefined) => {
      if (current_progress !== undefined) progress = current_progress;
      dispatchEvent(
        new CustomEvent("progress_changed", { detail: progress + 1 }),
      );
      setProgress(progress + progressStep);
      if (show_title_page === 1) setShowTitlePage(2);
      setProgressStep(1);
      setRight(false);
    },
    [
      progress,
      setProgress,
      setRight,
      progressStep,
      show_title_page,
      setShowTitlePage,
    ],
  );

  let next = React.useCallback(() => {
    if (!blocked) {
      advance_progress();
    }
    //           dispatchEvent(new CustomEvent('next_button_clicked', {detail: progress}));
  }, [blocked, progress, advance_progress]);

  let finish = React.useCallback(() => {
    const end = async () => {
      if (!id) return;
      if (storyFinishedIndexUpdate) await storyFinishedIndexUpdate(id);
      router.push("/" + course);
    };
    end();
  }, [id, course, router]);

  useEffect(() => {
    if (!storyElement.current) return;
    if (mainElement.current?.querySelector("#finishedPage")) {
      mainElement.current
        .querySelector("#finishedPage")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    let parts = storyElement.current.querySelectorAll(
      "div.part:not([data-hidden=true])",
    );
    let last = parts[parts.length - 1];

    if (!editor) {
      last.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editor, storyElement, progress]);

  let controls = React.useCallback(() => {
    return {
      wrong: wrong,
      right: right_call,
      block_next: block_next,
      setProgressStep: setProgressStep,
      next: next,
      advance_progress: advance_progress,
      id: Math.random(),
      rtl: story.learning_language_rtl,
      audio_failed_call: audio_failed_call,
      auto_play: !!auto_play,
      hide_questions: !!auto_play || hide_questions,
    };
  }, [
    wrong,
    right_call,
    setProgressStep,
    next,
    advance_progress,
    audio_failed_call,
    story.learning_language_rtl,
  ])();

  let parts: StoryElement[][] = [];
  let last_id = -1;
  for (let element of story.elements) {
    if (element.trackingProperties === undefined) {
      continue;
    }
    if (last_id !== element.trackingProperties.line_index) {
      parts.push([]);
      last_id = element.trackingProperties.line_index;
    }
    parts[parts.length - 1].push(element);
  }

  let finished = progress === parts.length;

  React.useEffect(() => {
    if (progress === -1 && audio_loaded) advance_progress();
  }, [audio_loaded, advance_progress, progress]);

  if (editor) {
    //React.useMemo(() => {}, [story.id]);
    return (
      <StoryContext.Provider value={controls}>
        <audio ref={ref_audio1}>
          <source
            src={
              "https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3"
            }
            type="audio/mp3"
          />
        </audio>
        <audio ref={ref_audio2}>
          <source
            src={
              "https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3"
            }
            type="audio/mp3"
          />
        </audio>
        <audio ref={ref_audio3}>
          <source
            src={
              "https://d35aaqx5ub95lt.cloudfront.net/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3"
            }
            type="audio/mp3"
          />
        </audio>
        <div
          ref={storyElement}
          className={
            styles.story +
            " " +
            (story.learning_language_rtl ? styles.story_rtl : "")
          }
        >
          {parts.map((part, i) => (
            <Part
              key={i}
              editor={editor}
              controls={controls}
              progress={progress}
              part={part}
            />
          ))}
        </div>
      </StoryContext.Provider>
    );
  }

  let audios = undefined;
  if (!editor) {
    let audio_urls: string[] = [];
    for (let element of story.elements) {
      if (element.type === "HEADER" || element.type === "LINE")
        if (element.audio && element.audio.url)
          audio_urls.push(element.audio.url);
    }

    const audio_base_path = "https://carex.uber.space/stories/";
    audios = React.useMemo(() => {
      if (audio_loaded) return;

      let count = 0;
      let audios: { [key: string]: HTMLAudioElement } = {};
      audio_urls = [];
      for (let url of audio_urls) {
        if (audios[url] === undefined && url !== undefined) {
          count += 1;
          let a = new Audio();
          function loadingFinished() {
            a.removeEventListener("canplaythrough", loadingFinished);
            a.removeEventListener("error", loadingFinished);
            count -= 1;
            if (count === 0) setAudioLoaded(1);
          }
          a.addEventListener("canplaythrough", loadingFinished, false);
          a.addEventListener("error", loadingFinished);
          audios[url] = a;
          a.src = audio_base_path + url;
          a.load();
        }
      }
      if (count === 0) {
        setAudioLoaded(1);
      }
      return audios;
    }, [audio_urls]);
  }

  let key_event_handler = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!finished) next();
        else finish();
      }
    },
    [next, finish, finished],
  );
  React.useEffect(() => {
    window.addEventListener("keypress", key_event_handler);
    return () => window.removeEventListener("keypress", key_event_handler);
  }, [key_event_handler]);

  //if(!audio_loaded)
  //    return <Spinner />

  //if(progress === -1)
  //    return <StoryTitlePage story={story}/>

  return (
    <>
      <div className={show_title_page === 1 ? "" : styles.hidden}>
        <StoryHeader course={course} length={1} />
        {localization && (
          <StoryTitlePage
            story={story}
            controls={controls}
            localization={localization}
          />
        )}
      </div>
      <div className={show_title_page !== 1 ? "" : styles.hidden}>
        <audio ref={ref_audio1}>
          <source
            src={
              "https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3"
            }
            type="audio/mp3"
          />
        </audio>
        <audio ref={ref_audio2}>
          <source
            src={
              "https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3"
            }
            type="audio/mp3"
          />
        </audio>
        <audio ref={ref_audio3}>
          <source
            src={
              "https://d35aaqx5ub95lt.cloudfront.net/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3"
            }
            type="audio/mp3"
          />
        </audio>

        <StoryHeader
          progress={progress}
          length={parts.length}
          course={course}
        />
        <div className={styles.main} ref={mainElement}>
          <div
            ref={storyElement}
            className={
              styles.story +
              " " +
              (story.learning_language_rtl ? styles.story_rtl : "")
            }
          >
            {controls.auto_play ? (
              <>
                <div className={styles.spacer_small_top} />
                <Legal />
              </>
            ) : (
              <Legal />
            )}
            <StoryContext.Provider value={controls}>
              {parts.map((part, i) => (
                <Part
                  key={i}
                  editor={editor}
                  controls={controls}
                  progress={progress}
                  part={part}
                  audios={audios}
                />
              ))}
            </StoryContext.Provider>
          </div>
          {controls.auto_play ? (
            <div className={styles.spacer_small} />
          ) : (
            <div className={styles.spacer} />
          )}
          {finished && localization ? (
            <FinishedPage story={story} localization={localization} />
          ) : null}
        </div>
        {controls.auto_play
          ? null
          : localization && (
              <Footer
                right={right}
                finished={finished}
                blocked={blocked}
                next={next}
                finish={finish}
                localization={localization}
              />
            )}
      </div>
    </>
  );
}
