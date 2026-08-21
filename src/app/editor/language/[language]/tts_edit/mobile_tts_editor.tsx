"use client";

import React from "react";
import MobileEditorSectionSwitch from "@/app/editor/_components/mobile_editor_section_switch";
import { useEditorMobileTabScroll } from "@/app/editor/_components/use_editor_mobile_tab_scroll";
import { PlayButton } from "../language_editor";
import type { SpeakersType } from "../types";

type MobileTtsSection = "rules" | "test";
export type RulesSaveStatus = "idle" | "saving" | "saved" | "error";

type RulesModel = {
  value: string;
  hasError: boolean;
  isDirty: boolean;
  saveStatus: RulesSaveStatus;
  onChange: (value: string) => void;
  onSave: () => void;
};

type TestModel = {
  text: string;
  pitch: number;
  speed: number;
  speakers: SpeakersType[];
  customSpeaker: string;
  transcribedText: string;
  finalText: React.ReactNode;
  onTextChange: (value: string) => void;
  onPitchChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onCustomSpeakerChange: (value: string) => void;
  onPlay: (
    event: React.MouseEvent,
    speaker: string,
    name: string,
  ) => Promise<void>;
};

const MOBILE_TTS_SECTIONS = [
  { value: "rules", label: "Rules" },
  { value: "test", label: "Test" },
] as const;

export default function MobileTtsEditor({
  rules,
  test,
}: {
  rules: RulesModel;
  test: TestModel;
}) {
  const [selectedSection, setSelectedSection] =
    React.useState<MobileTtsSection>("rules");
  const selectSection = useEditorMobileTabScroll({
    enabled: true,
    selectedSection,
    onSectionSelect: setSelectedSection,
  });

  return (
    <div className="hidden max-[975px]:block">
      <MobileEditorSectionSwitch
        label="Pronunciation rule sections"
        options={MOBILE_TTS_SECTIONS}
        selected={selectedSection}
        onSelect={selectSection}
      />
      <MobileRulesPanel hidden={selectedSection !== "rules"} rules={rules} />
      <MobileTestPanel hidden={selectedSection !== "test"} test={test} />
    </div>
  );
}

function MobileRulesPanel({
  hidden,
  rules,
}: {
  hidden: boolean;
  rules: RulesModel;
}) {
  const statusText = getRulesStatusText(rules);

  return (
    <section className={hidden ? "hidden" : "px-3 pb-24"}>
      <h1 className="mt-4 mb-1 text-xl font-bold">Pronunciation rules</h1>
      <p className="mt-0 mb-4 text-sm text-[var(--text-color-dim)]">
        Replace letters, word fragments, or complete words before speech is
        generated.
      </p>
      <label className="grid gap-2 text-sm font-semibold">
        Rules in YAML format
        <textarea
          aria-invalid={rules.hasError}
          aria-describedby="mobile-rules-status"
          spellCheck={false}
          className={`min-h-[58dvh] w-full resize-y rounded-xl border-2 bg-[var(--input-background)] p-3 font-mono !text-base leading-6 text-[var(--text-color)] ${
            rules.hasError ? "border-red-500" : "border-[var(--input-border)]"
          }`}
          value={rules.value}
          onChange={(event) => rules.onChange(event.target.value)}
        />
      </label>
      <div className="sticky bottom-0 z-10 -mx-3 mt-4 flex min-h-16 items-center justify-between gap-3 border-t border-[var(--header-border)] bg-[var(--body-background)] px-3 pb-[env(safe-area-inset-bottom)]">
        <span
          id="mobile-rules-status"
          aria-live="polite"
          className={`min-w-0 text-sm ${
            rules.hasError || rules.saveStatus === "error"
              ? "text-red-700"
              : "text-[var(--text-color-dim)]"
          }`}
        >
          {statusText}
        </span>
        <button
          type="button"
          disabled={
            rules.hasError || !rules.isDirty || rules.saveStatus === "saving"
          }
          className="min-h-11 shrink-0 rounded-xl bg-[var(--button-background)] px-5 !text-base font-bold text-[var(--button-color)] disabled:cursor-default disabled:opacity-40"
          onClick={rules.onSave}
        >
          {rules.saveStatus === "saving" ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}

function MobileTestPanel({
  hidden,
  test,
}: {
  hidden: boolean;
  test: TestModel;
}) {
  return (
    <section className={hidden ? "hidden" : "px-3 pb-8"}>
      <h1 className="mt-4 mb-3 text-xl font-bold">Test pronunciation</h1>
      <label className="grid gap-2 text-sm font-semibold">
        Test text
        <textarea
          className="min-h-24 w-full rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] p-3 !text-base text-[var(--text-color)]"
          value={test.text}
          onChange={(event) => test.onTextChange(event.target.value)}
        />
      </label>
      <div className="mt-4 grid grid-cols-[64px_minmax(0,1fr)] items-center gap-y-2 !text-base">
        <label htmlFor="mobile-tts-pitch">Pitch</label>
        <input
          id="mobile-tts-pitch"
          aria-label="Pitch"
          className="min-h-11 w-full"
          type="range"
          min="0"
          max="4"
          value={test.pitch}
          onChange={(event) =>
            test.onPitchChange(Number.parseInt(event.target.value))
          }
        />
        <label htmlFor="mobile-tts-speed">Speed</label>
        <input
          id="mobile-tts-speed"
          aria-label="Speed"
          className="min-h-11 w-full"
          type="range"
          min="0"
          max="4"
          value={test.speed}
          onChange={(event) =>
            test.onSpeedChange(Number.parseInt(event.target.value))
          }
        />
      </div>
      <h2 className="mt-5 mb-1 text-lg font-bold">Available voices</h2>
      <div role="list" aria-label="Available voices">
        {test.speakers.map((speaker) => (
          <div
            role="listitem"
            key={speaker.id}
            className="grid min-h-14 grid-cols-[44px_minmax(0,1fr)] items-center gap-2 border-b border-[var(--header-border)]"
          >
            <PlayButton
              play={test.onPlay}
              speaker={speaker.speaker}
              name="Duo"
              largeTouchTarget
            />
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold">
                {speaker.speaker}
              </span>
              <span className="block truncate text-sm text-[var(--text-color-dim)]">
                {speaker.gender} · {speaker.type}
              </span>
            </span>
          </div>
        ))}
      </div>
      <details className="mt-4 rounded-xl border border-[var(--header-border)] p-3">
        <summary className="min-h-11 cursor-pointer !text-base font-semibold">
          Custom voice
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <PlayButton
            play={test.onPlay}
            speaker={test.customSpeaker}
            name="Duo"
            largeTouchTarget
          />
          <label className="min-w-0 flex-1 text-sm font-semibold">
            <span className="sr-only">Custom voice name</span>
            <input
              className="h-11 w-full rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-3 !text-base font-normal text-[var(--text-color)]"
              value={test.customSpeaker}
              onChange={(event) =>
                test.onCustomSpeakerChange(event.target.value)
              }
              placeholder="Voice name"
              type="text"
            />
          </label>
        </div>
      </details>
      {test.transcribedText ? (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-bold">Output</h2>
          <h3 className="mb-1 text-sm font-semibold text-[var(--text-color-dim)]">
            Transcribed text
          </h3>
          <p className="mt-0 break-words rounded-xl bg-[var(--body-background-faint)] p-3 !text-base">
            {test.transcribedText}
          </p>
          <h3 className="mt-4 mb-1 text-sm font-semibold text-[var(--text-color-dim)]">
            Final text
          </h3>
          <div className="overflow-hidden rounded-xl border border-[var(--header-border)] p-3">
            {test.finalText}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getRulesStatusText(rules: RulesModel) {
  if (rules.hasError) return "Fix the YAML error before saving.";
  if (rules.saveStatus === "saving") return "Saving changes…";
  if (rules.saveStatus === "error") return "Could not save changes.";
  if (rules.isDirty) return "Unsaved changes";
  if (rules.saveStatus === "saved") return "Saved";
  return "No unsaved changes";
}
