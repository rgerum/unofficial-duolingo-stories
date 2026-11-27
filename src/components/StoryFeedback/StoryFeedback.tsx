"use client";

import React from "react";
import { useMutation } from "convex/react";
import { MessageCircle } from "lucide-react";
import StoryTextLine from "@/components/StoryTextLine";
import Button, {
  buttonInnerClassName,
  buttonRootClassName,
} from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StorySettings } from "@/components/StoryProgress";
import type { StoryElementLine } from "@/components/editor/story/syntax_parser_types";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { Textarea } from "@ui-sdk/react/textarea";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  type FeedbackSubmitError,
  getFeedbackSubmitError,
} from "./feedbackErrors";
import { createOperationKey } from "@/lib/operation-key";

type StoryFeedbackProps = {
  storyId: number;
  line?: number;
  lineIndex?: number;
  lineText?: string;
  lineElement?: StoryElementLine;
  settings: StorySettings;
  hidden?: boolean;
  className?: string;
};

const feedbackCategories = [
  { label: "Text", value: "Text" },
  { label: "Translation hints", value: "Translation hints" },
  { label: "Audio", value: "Audio" },
  { label: "Other", value: "Other" },
] as const;

type FeedbackCategory = (typeof feedbackCategories)[number]["value"];

export default function StoryFeedback({
  storyId,
  line,
  lineIndex,
  lineText,
  lineElement,
  settings,
  hidden = false,
  className,
}: StoryFeedbackProps) {
  const submitStoryFeedback = useMutation(
    api.storyFeedback.submitStoryFeedback,
  );
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<FeedbackCategory>(
    feedbackCategories[0].value,
  );
  const [comment, setComment] = React.useState("");
  const [submitState, setSubmitState] = React.useState<
    "idle" | "submitting" | "submitted"
  >("idle");
  const [submitError, setSubmitError] =
    React.useState<FeedbackSubmitError | null>(null);
  const [operationKey, setOperationKey] = React.useState(createOperationKey);
  const isSubmitting = submitState === "submitting";
  const isSubmitted = submitState === "submitted";
  const terminalRejection = submitError?.canRetry === false;
  const formLocked = isSubmitting || isSubmitted || terminalRejection;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSubmitState("idle");
      setSubmitError(null);
    } else {
      setComment("");
      setOperationKey(createOperationKey());
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-full border-2 border-[color:color-mix(in_srgb,var(--link-blue)_34%,var(--overview-hr))] bg-[var(--body-background)] px-4 text-[0.92rem] font-bold text-[var(--text-color)] no-underline shadow-[0_4px_12px_color-mix(in_srgb,#000_12%,transparent)] transition-[background-color,border-color,color,transform,opacity] duration-100 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--link-blue)_58%,var(--overview-hr))] hover:bg-[color:color-mix(in_srgb,var(--link-blue)_10%,var(--body-background))] hover:text-[var(--text-color)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[color:color-mix(in_srgb,var(--ring)_35%,transparent)]",
          hidden && "pointer-events-none opacity-0",
          className,
        )}
        aria-label="Give feedback about this story"
        title="Give feedback"
      >
        <MessageCircle aria-hidden="true" className="h-6 w-6" />
        <span>Feedback</span>
      </DialogTrigger>
      <DialogContent className="max-w-[640px] overflow-x-hidden rounded-[18px] bg-[var(--body-background)] text-[var(--text-color)] sm:max-w-[640px]">
        <DialogTitle className="text-[1.2rem] font-bold">
          Give feedback
        </DialogTitle>
        <DialogDescription className="text-[0.95rem] text-[var(--text-color-dim)]">
          Report a problem with this story line.
        </DialogDescription>

        <div className="min-w-0 overflow-hidden">
          <div className="mb-1 text-[0.76rem] font-bold tracking-[0.1em] text-[var(--title-color-dim)] uppercase">
            Current line
          </div>
          {lineElement ? (
            <div className="mt-3 min-w-0 overflow-hidden [&_.audio-button]:shrink-0">
              <StoryTextLine
                active={false}
                element={lineElement}
                settings={settings}
                compact
              />
            </div>
          ) : (
            <p className="mt-3 mb-0 whitespace-pre-wrap text-[1rem] leading-6">
              {lineText || `Story ${storyId}`}
            </p>
          )}
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) return;

            setSubmitState("submitting");
            setSubmitError(null);

            try {
              await submitStoryFeedback({
                storyId,
                operationKey,
                source: "web",
                line,
                lineIndex,
                lineText,
                category,
                comment,
              });
              setSubmitState("submitted");
              setComment("");
            } catch (error) {
              setSubmitState("idle");
              setSubmitError(getFeedbackSubmitError(error));
            }
          }}
        >
          <Field className="grid gap-2" disabled={formLocked}>
            <FieldLabel className="text-[0.92rem] font-bold">
              Category
            </FieldLabel>
            <SegmentedControl
              value={category}
              onValueChange={(value) => {
                if (value) setCategory(value as FeedbackCategory);
              }}
              className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {feedbackCategories.map((option) => (
                <SegmentedControlItem
                  key={option.value}
                  value={option.value}
                  className="min-h-11 min-w-0 rounded-[13px] border-2 border-[var(--overview-hr)] bg-[var(--body-background)] px-2 py-2 text-[0.82rem] font-bold whitespace-nowrap text-[var(--text-color)] transition-[background-color,border-color,color] duration-100 hover:border-[color:color-mix(in_srgb,var(--link-blue)_35%,var(--overview-hr))] hover:bg-[color:color-mix(in_srgb,var(--link-blue)_8%,var(--body-background))] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[color:color-mix(in_srgb,var(--ring)_35%,transparent)] disabled:cursor-not-allowed disabled:opacity-60 data-checked:border-[var(--button-blue-border)] data-checked:bg-[var(--button-blue-background)] data-checked:text-[var(--button-blue-color)] sm:px-3 sm:text-[0.86rem]"
                >
                  {option.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </Field>

          <Field className="grid gap-2" disabled={formLocked}>
            <FieldLabel className="text-[0.92rem] font-bold">
              Comment
            </FieldLabel>
            <Textarea
              value={comment}
              onValueChange={(value) => setComment(value)}
              rows={5}
              maxLength={2000}
              required
              className="w-full resize-y rounded-[14px] border-2 border-[var(--input-border)] bg-[var(--input-background)] px-4 py-3 text-[1rem] font-normal leading-6 text-[var(--text-color)] outline-none focus:border-[color:color-mix(in_srgb,var(--link-blue)_45%,var(--input-border))]"
              placeholder="What should be fixed?"
            />
          </Field>

          {submitError ? (
            <div
              className="rounded-[12px] border-2 border-[#e66969] bg-[#fff1f1] px-4 py-3 text-[0.95rem] font-bold text-[#9b1c1c]"
              role="alert"
            >
              {submitError.message}
            </div>
          ) : null}
          {isSubmitted ? (
            <div className="rounded-[12px] border-2 border-[color:color-mix(in_srgb,var(--button-blue-background)_45%,var(--overview-hr))] bg-[color:color-mix(in_srgb,var(--button-blue-background)_10%,var(--body-background))] px-4 py-3 text-[0.95rem] font-bold text-[var(--text-color)]">
              Thanks, your feedback was saved.
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose
              disabled={isSubmitting}
              className={buttonRootClassName({
                disabled: isSubmitting,
                variant: "secondary",
              })}
            >
              <span
                className={buttonInnerClassName({
                  disabled: isSubmitting,
                  variant: "secondary",
                })}
              >
                {isSubmitted ? "Done" : terminalRejection ? "Close" : "Cancel"}
              </span>
            </DialogClose>
            {!isSubmitted && !terminalRejection ? (
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || comment.trim().length === 0}
              >
                {isSubmitting ? "Submitting" : "Submit feedback"}
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
