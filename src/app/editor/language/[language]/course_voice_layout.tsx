"use client";

import React, { useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleXIcon,
  CopyIcon,
  SaveIcon,
  Volume2Icon,
} from "lucide-react";
import MobileEditorSectionSwitch from "@/app/editor/_components/mobile_editor_section_switch";
import { useEditorMobileTabScroll } from "@/app/editor/_components/use_editor_mobile_tab_scroll";
import PlayAudio from "@/components/PlayAudio";
import {
  getCourseVoiceLayoutClassNames,
  type MobileVoiceSection,
} from "./course_voice_layout_classes";
import type { SpeakersType } from "./types";

export type { MobileVoiceSection } from "./course_voice_layout_classes";
export type CopyFeedbackStatus = "idle" | "copied" | "error";

const COPY_FEEDBACK_PRESENTATION = {
  idle: {
    getLabel: (speaker: string) => `Copy ${speaker}`,
    className: "text-[var(--text-color-dim)]",
    Icon: CopyIcon,
  },
  copied: {
    getLabel: (speaker: string) => `Voice copied: ${speaker}`,
    className: "bg-green-100 text-green-700",
    Icon: CheckIcon,
  },
  error: {
    getLabel: (speaker: string) => `Could not copy voice: ${speaker}`,
    className: "bg-red-100 text-red-700",
    Icon: CircleXIcon,
  },
} satisfies Record<
  CopyFeedbackStatus,
  {
    getLabel: (speaker: string) => string;
    className: string;
    Icon: typeof CopyIcon;
  }
>;

type VoiceTestModel = {
  audioElement: React.ReactNode;
  hints: React.ReactNode;
  phrase: string;
  phraseChanged: boolean;
  pitch: number;
  speed: number;
  onPhraseChange: (value: string) => void;
  onSavePhrase: () => void;
  onPitchChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onReplay?: () => void;
};

type VoiceListModel = {
  rows: React.ReactNode;
};

type CastModel = {
  mainRows: React.ReactNode;
  secondaryRows: React.ReactNode;
  secondaryCount: number;
  secondaryExpanded: boolean;
  onToggleSecondary: () => void;
};

const MOBILE_VOICE_SECTIONS = [
  { value: "cast", label: "Cast" },
  { value: "voices", label: "Voices" },
] as const;

export function CourseVoiceLayout({
  mobileCourseLayout: enabled,
  selectedSection,
  onSectionSelect,
  test,
  voices,
  cast,
}: {
  mobileCourseLayout: boolean;
  selectedSection: MobileVoiceSection;
  onSectionSelect: (section: MobileVoiceSection) => void;
  test: VoiceTestModel;
  voices: VoiceListModel;
  cast: CastModel;
}) {
  const selectSection = useEditorMobileTabScroll({
    enabled,
    selectedSection,
    onSectionSelect,
  });
  const classNames = getCourseVoiceLayoutClassNames({
    mobileCourseLayout: enabled,
    selectedSection,
  });

  return (
    <div>
      {enabled ? (
        <MobileEditorSectionSwitch
          label="Character voice sections"
          options={MOBILE_VOICE_SECTIONS}
          selected={selectedSection}
          onSelect={selectSection}
        />
      ) : null}
      <div className={enabled ? "min-[976px]:flex" : "contents"}>
        <div className={classNames.voices}>
          {test.audioElement}
          {enabled ? (
            <h2 className="m-0 px-3 pt-4 text-lg font-bold min-[976px]:hidden">
              Test voice
            </h2>
          ) : null}
          <div
            className={
              enabled
                ? "max-[975px]:mx-3 max-[975px]:mt-3 max-[975px]:rounded-2xl max-[975px]:bg-[var(--body-background-faint)] max-[975px]:p-3"
                : undefined
            }
          >
            {enabled ? (
              <div className="mb-2 flex min-h-11 items-center gap-2 min-[976px]:hidden">
                <button
                  type="button"
                  aria-label="Replay test sample"
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-color)]"
                  disabled={!test.onReplay}
                  onClick={test.onReplay}
                >
                  <Volume2Icon className="size-6" />
                </button>
                <div className="min-w-0">{test.hints}</div>
              </div>
            ) : null}
            <div className={enabled ? "max-[975px]:hidden" : undefined}>
              <PlayAudio onClick={test.onReplay} />
              {test.hints}
            </div>
            <textarea
              aria-label="Test phrase"
              className={`w-full rounded-[5px] border border-[var(--input-border)] bg-[var(--input-background)] text-[var(--text-color)] ${
                enabled
                  ? "max-[975px]:min-h-20 max-[975px]:rounded-xl max-[975px]:border-2 max-[975px]:p-3 max-[975px]:!text-base"
                  : ""
              }`}
              value={test.phrase}
              onChange={(event) => test.onPhraseChange(event.target.value)}
            />
            <input
              className={`mt-[6px] cursor-pointer rounded-[8px] border border-[var(--input-border)] bg-[var(--input-background)] px-[10px] py-[4px] text-[var(--text-color)] disabled:cursor-default disabled:opacity-70 ${
                enabled
                  ? "max-[975px]:min-h-11 max-[975px]:rounded-xl max-[975px]:!text-base"
                  : ""
              }`}
              value={`save${test.phraseChanged ? "*" : ""}`}
              onClick={test.onSavePhrase}
              disabled={!test.phraseChanged}
              type="button"
            />
          </div>
          <div
            className={`mt-2 ${
              enabled
                ? "max-[975px]:mx-3 max-[975px]:grid max-[975px]:grid-cols-[70px_minmax(0,1fr)] max-[975px]:items-center max-[975px]:gap-y-2 max-[975px]:!text-base"
                : ""
            }`}
          >
            Pitch:{" "}
            <input
              className={
                enabled ? "max-[975px]:min-h-11 max-[975px]:w-full" : undefined
              }
              aria-label="Pitch"
              type="range"
              min="0"
              max="4"
              value={test.pitch}
              id="pitch"
              onChange={(event) =>
                test.onPitchChange(Number.parseInt(event.target.value))
              }
            />
            {enabled ? (
              <>
                <span className="min-[976px]:hidden">Speed:</span>
                <input
                  className="min-h-11 w-full min-[976px]:hidden"
                  aria-label="Speed"
                  type="range"
                  min="0"
                  max="4"
                  value={test.speed}
                  id="speed-mobile"
                  onChange={(event) =>
                    test.onSpeedChange(Number.parseInt(event.target.value))
                  }
                />
              </>
            ) : null}
          </div>
          <div className={`mt-2 ${enabled ? "max-[975px]:hidden" : ""}`}>
            Speed:{" "}
            <input
              type="range"
              min="0"
              max="4"
              value={test.speed}
              id="speed"
              onChange={(event) =>
                test.onSpeedChange(Number.parseInt(event.target.value))
              }
            />
          </div>
          {enabled ? (
            <h2 className="m-0 px-3 pt-6 pb-2 text-lg font-bold min-[976px]:hidden">
              Available voices
            </h2>
          ) : null}
          <div className={classNames.voiceList}>
            <table
              className={`mt-4 w-full border-collapse [&_td]:px-[6px] [&_td]:py-[6px] [&_td]:leading-[1.25] [&_th]:sticky [&_th]:top-0 [&_th]:bg-[var(--button-background)] [&_th]:px-2 [&_th]:py-[5px] [&_th]:text-left [&_th]:font-bold [&_th]:leading-[1.25] [&_th]:text-[var(--button-color)] [&_tr:nth-child(2n)]:bg-[var(--body-background-faint)] ${
                enabled
                  ? "max-[975px]:mt-0 max-[975px]:block max-[975px]:[&_tbody]:block max-[975px]:[&_thead]:hidden max-[975px]:[&_tr:nth-child(2n)]:bg-transparent"
                  : ""
              }`}
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
              <tbody>{voices.rows}</tbody>
            </table>
          </div>
        </div>
        <div className={classNames.cast}>
          {enabled ? (
            <h2 className="m-0 px-3 pt-4 pb-2 text-lg font-bold min-[976px]:hidden">
              Main cast
            </h2>
          ) : null}
          <p className={enabled ? "my-4 max-[975px]:hidden" : "my-4"}>
            These characters are the default cast of duolingo. Their names
            should be kept as close to the original as possible.
          </p>
          <div
            className={`flex flex-wrap gap-[5px] p-[5px] min-[601px]:gap-0 min-[601px]:p-0 ${
              enabled
                ? "max-[975px]:flex-col max-[975px]:gap-0 max-[975px]:p-0"
                : ""
            }`}
            data-cy="avatar_list1"
          >
            {cast.mainRows}
          </div>
          {enabled ? (
            <button
              type="button"
              aria-expanded={cast.secondaryExpanded}
              className="flex min-h-14 w-full items-center justify-between border-y border-[var(--header-border)] px-3 text-left !text-base font-bold min-[976px]:hidden"
              onClick={cast.onToggleSecondary}
            >
              Secondary cast
              <span className="inline-flex items-center gap-2 text-sm font-normal text-[var(--text-color-dim)]">
                {cast.secondaryCount}
                <ChevronDownIcon
                  className={`size-5 transition-transform ${cast.secondaryExpanded ? "rotate-180" : ""}`}
                />
              </span>
            </button>
          ) : null}
          <p className={enabled ? "my-4 max-[975px]:hidden" : "my-4"}>
            These characters just appear in a couple of stories.
          </p>
          <div
            className={`flex flex-wrap gap-[5px] p-[5px] min-[601px]:gap-0 min-[601px]:p-0 ${
              enabled
                ? `max-[975px]:flex-col max-[975px]:gap-0 max-[975px]:p-0 ${
                    cast.secondaryExpanded ? "" : "max-[975px]:hidden"
                  }`
                : ""
            }`}
            data-cy="avatar_list2"
          >
            {cast.secondaryRows}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileAvatarEditor({
  avatarId,
  avatarUrl,
  displayName,
  placeholderName,
  inputName,
  inputSpeaker,
  unsaved,
  nameMode,
  playControl,
  onNameChange,
  onSpeakerChange,
  onSave,
}: {
  avatarId: number;
  avatarUrl: string;
  displayName: string;
  placeholderName: string;
  inputName: string;
  inputSpeaker: string;
  unsaved: boolean;
  nameMode: "read-only" | "editable" | "disabled";
  playControl: React.ReactNode;
  onNameChange: (value: string) => void;
  onSpeakerChange: (value: string) => void;
  onSave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[var(--header-border)] py-1 min-[976px]:hidden">
      <button
        type="button"
        aria-expanded={expanded}
        className="grid min-h-16 w-full grid-cols-[52px_minmax(0,1fr)_44px] items-center gap-3 px-3 text-left !text-base text-[var(--text-color)]"
        onClick={() => setExpanded((current) => !current)}
      >
        <img
          alt=""
          src={avatarUrl}
          className="max-h-12 max-w-12 justify-self-center"
        />
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-bold">{displayName}</span>
            {unsaved ? (
              <>
                <span className="sr-only">Unsaved changes</span>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-[var(--button-background)]"
                />
              </>
            ) : null}
          </span>
          <span className="block truncate text-sm text-[var(--text-color-dim)]">
            {inputSpeaker || "No voice selected"} · #{avatarId}
          </span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-5 justify-self-center transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded ? (
        <div className="grid gap-3 px-3 pb-4 pl-[76px]">
          {nameMode !== "read-only" ? (
            <label className="grid gap-1 text-sm font-semibold">
              Name
              <input
                className="h-11 min-w-0 rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-3 !text-base font-normal text-[var(--text-color)]"
                value={inputName}
                disabled={nameMode === "disabled"}
                onChange={(event) => onNameChange(event.target.value)}
                type="text"
                placeholder={placeholderName}
              />
            </label>
          ) : (
            <p className="m-0 text-sm text-[var(--text-color-dim)]">
              Character name: {displayName}
            </p>
          )}
          <label className="grid gap-1 text-sm font-semibold">
            Voice
            <input
              className="h-11 min-w-0 rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-3 !text-base font-normal text-[var(--text-color)]"
              value={inputSpeaker}
              onChange={(event) => onSpeakerChange(event.target.value)}
              type="text"
              placeholder="Voice name"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
              {playControl}
              Test voice
            </span>
            <button
              type="button"
              disabled={!unsaved}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--button-background)] px-4 !text-base font-bold text-[var(--button-color)] disabled:cursor-default disabled:opacity-40"
              onClick={onSave}
            >
              <SaveIcon className="size-4" />
              Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MobileSpeakerRow({
  speaker,
  playControl,
  onCopy,
  copyStatus,
}: {
  speaker: SpeakersType;
  playControl: React.ReactNode;
  onCopy: (event: React.MouseEvent<HTMLButtonElement>) => void;
  copyStatus: CopyFeedbackStatus;
}) {
  const copyPresentation = COPY_FEEDBACK_PRESENTATION[copyStatus];
  const copyLabel = copyPresentation.getLabel(speaker.speaker);
  const CopyStatusIcon = copyPresentation.Icon;

  return (
    <tr className="hidden max-[975px]:block">
      <td className="block !p-0">
        <div className="grid min-h-14 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 border-b border-[var(--header-border)] px-3">
          <span className="grid size-11 place-items-center">{playControl}</span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold">
              {speaker.speaker}
            </span>
            <span className="block truncate text-sm text-[var(--text-color-dim)]">
              {speaker.gender} · {speaker.type}
            </span>
          </span>
          <button
            type="button"
            aria-label={copyLabel}
            className={`grid size-11 place-items-center rounded-xl transition-colors ${copyPresentation.className}`}
            onClick={onCopy}
          >
            <CopyStatusIcon aria-hidden="true" className="size-5" />
          </button>
          <span aria-live="polite" className="sr-only">
            {copyStatus === "idle" ? "" : copyLabel}
          </span>
        </div>
      </td>
    </tr>
  );
}
