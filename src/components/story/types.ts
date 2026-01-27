import type { Dispatch, SetStateAction } from "react";

/**
 * Story controls passed via StoryContext
 */
export interface StoryControls {
  wrong: () => void;
  right: () => void;
  block_next: () => void;
  setProgressStep: Dispatch<SetStateAction<number>>;
  next: () => void;
  advance_progress: (current_progress?: number) => void;
  id: number;
  rtl: boolean;
  audio_failed_call: () => void;
  auto_play: boolean;
  hide_questions: boolean;
}

/**
 * Button click state for question components
 */
export type ButtonState = "right" | "wrong" | "selected" | "done" | "false" | undefined;

/**
 * Match question clicked state
 */
export type MatchClickedState = "right" | "wrong" | "selected" | undefined;
