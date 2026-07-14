import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { useConvex, useMutation } from "convex/react";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { api } from "../api";
import { Button } from "../components/Button";
import { Text, TextInput } from "../components/Text";
import { type ThemeColors, useTheme } from "../theme";
import { TextLine } from "./elements/TextLine";
import {
  type FeedbackSubmitError,
  getFeedbackSubmitError,
} from "./feedbackErrors";
import {
  FEEDBACK_SUBMISSION_TIMEOUT_MS,
  FeedbackSubmissionTimeoutError,
  submitFeedbackWithTimeout,
  waitForFeedbackConnection,
} from "./feedbackSubmission";
import type { StoryElement, StoryElementLine } from "./types";

const feedbackCategories = [
  { label: "Text", value: "Text" },
  { label: "Translation", value: "Translation hints" },
  { label: "Audio", value: "Audio" },
  { label: "Other", value: "Other" },
] as const;

type FeedbackCategory = (typeof feedbackCategories)[number]["value"];
type SubmitFeedback = (args: {
  storyId: number;
  operationKey: string;
  lineIndex?: number;
  lineText?: string;
  category: FeedbackCategory;
  comment: string;
}) => Promise<unknown>;

export function StoryFeedbackFloat({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={floatingStyles.root}>{children}</View>;
}

const floatingStyles = StyleSheet.create({
  root: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
});

function createOperationKey(storyId: number) {
  return `mobile-feedback:${storyId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function getAnswerText(answer: string | { text?: string }) {
  return typeof answer === "string" ? answer : (answer.text ?? "");
}

function getFeedbackTextForElement(element: StoryElement) {
  if (element.type === "HEADER") {
    return element.learningLanguageTitleContent.text;
  }
  if (element.type === "LINE") {
    const speaker =
      element.line.type === "CHARACTER"
        ? (element.line.characterName ?? `${element.line.characterId}`)
        : "";
    const text = element.line.content.text;
    return speaker ? `${speaker}: ${text}` : text;
  }
  if (element.type === "MULTIPLE_CHOICE") {
    return [
      element.question?.text,
      ...element.answers.map(getAnswerText),
    ].filter(Boolean);
  }
  if (element.type === "CHALLENGE_PROMPT") return element.prompt.text;
  if (element.type === "SELECT_PHRASE") {
    return element.answers.map(getAnswerText).filter(Boolean);
  }
  if (element.type === "ARRANGE") return element.selectablePhrases;
  if (element.type === "POINT_TO_PHRASE") {
    return [
      element.question.text,
      element.transcriptParts.map((part) => part.text).join(""),
    ].filter(Boolean);
  }
  if (element.type === "MATCH") {
    return [
      element.prompt,
      ...element.fallbackHints.map(
        (hint) => `${hint.phrase} = ${hint.translation}`,
      ),
    ].filter(Boolean);
  }
  if (element.type === "ERROR") return element.text;
  return "";
}

export function getFeedbackContext(
  currentPart: StoryElement[] | undefined,
  partProgress: number,
) {
  if (!currentPart?.length) return {};

  const lastElement = currentPart.at(-1);
  const visibleElement =
    partProgress > 0 &&
    lastElement &&
    (lastElement.type === "MULTIPLE_CHOICE" ||
      lastElement.type === "POINT_TO_PHRASE")
      ? lastElement
      : currentPart[0];
  const lineIndex =
    visibleElement?.trackingProperties.source_line_index ??
    visibleElement?.trackingProperties.line_index;
  const lineText = visibleElement
    ? [visibleElement]
        .flatMap((element) => getFeedbackTextForElement(element))
        .filter(Boolean)
        .join("\n")
    : "";

  return {
    ...(lineIndex !== undefined ? { lineIndex } : {}),
    ...(lineText ? { lineText } : {}),
    ...(visibleElement?.type === "LINE" ? { lineElement: visibleElement } : {}),
  };
}

export function StoryFeedback({
  storyId,
  lineIndex,
  lineText,
  lineElement,
  storyRtl = false,
  disabled = false,
  initialOpen = false,
  onOpen,
  submitFeedback: submitFeedbackOverride,
}: {
  storyId: number;
  lineIndex?: number;
  lineText?: string;
  lineElement?: StoryElementLine;
  storyRtl?: boolean;
  disabled?: boolean;
  initialOpen?: boolean;
  onOpen?: () => void;
  submitFeedback?: SubmitFeedback;
}) {
  const mutation = useMutation(api.storyFeedback.submitStoryFeedback);
  const submitFeedback = submitFeedbackOverride ?? mutation;
  const convex = useConvex();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = React.useState(initialOpen);
  const [category, setCategory] = React.useState<FeedbackCategory>("Text");
  const [comment, setComment] = React.useState("");
  const [submitState, setSubmitState] = React.useState<
    "idle" | "submitting" | "submitted" | "timedOut"
  >("idle");
  const [submitError, setSubmitError] =
    React.useState<FeedbackSubmitError | null>(null);
  const [operationKey, setOperationKey] = React.useState(() =>
    createOperationKey(storyId),
  );
  const sheetOpenRef = React.useRef(initialOpen);
  const submissionAttemptRef = React.useRef(0);
  const isSubmitting = submitState === "submitting";
  const isSubmitted = submitState === "submitted";
  const isTimedOut = submitState === "timedOut";

  const close = React.useCallback(() => {
    if (!sheetOpenRef.current) return;
    sheetOpenRef.current = false;
    submissionAttemptRef.current += 1;
    setOpen(false);
    setComment("");
    setSubmitError(null);
    setSubmitState("idle");
    setOperationKey(createOperationKey(storyId));
  }, [storyId]);

  const openSheet = React.useCallback(() => {
    if (disabled) return;
    sheetOpenRef.current = true;
    onOpen?.();
    setSubmitState("idle");
    setSubmitError(null);
    setOpen(true);
  }, [disabled, onOpen]);

  const submit = React.useCallback(async () => {
    if (isSubmitting || comment.trim().length === 0) return;
    const submissionAttempt = submissionAttemptRef.current + 1;
    submissionAttemptRef.current = submissionAttempt;
    const submissionDeadline = Date.now() + FEEDBACK_SUBMISSION_TIMEOUT_MS;
    setSubmitState("submitting");
    setSubmitError(null);
    try {
      if (submitFeedbackOverride === undefined) {
        await waitForFeedbackConnection(
          convex,
          Math.max(1, submissionDeadline - Date.now()),
        );
        if (submissionAttemptRef.current !== submissionAttempt) return;
      }
      await submitFeedbackWithTimeout(
        submitFeedback({
          storyId,
          operationKey,
          lineIndex,
          lineText,
          category,
          comment,
        }),
        Math.max(1, submissionDeadline - Date.now()),
      );
      if (submissionAttemptRef.current !== submissionAttempt) return;
      setComment("");
      setSubmitState("submitted");
    } catch (error) {
      if (submissionAttemptRef.current !== submissionAttempt) return;
      setSubmitState(
        error instanceof FeedbackSubmissionTimeoutError ? "timedOut" : "idle",
      );
      setSubmitError(getFeedbackSubmitError(error));
    }
  }, [
    category,
    comment,
    convex,
    isSubmitting,
    lineIndex,
    lineText,
    operationKey,
    storyId,
    submitFeedback,
    submitFeedbackOverride,
  ]);
  const terminalRejection = submitError?.canRetry === false;
  const formLocked =
    isSubmitting || isSubmitted || isTimedOut || terminalRejection;
  const primaryActionCloses = isSubmitted || terminalRejection;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Give feedback about this story"
        disabled={disabled}
        onPress={openSheet}
        style={({ pressed }) => [
          styles.trigger,
          disabled && styles.triggerDisabled,
          pressed && !disabled && styles.triggerPressed,
        ]}
      >
        <Ionicons name="chatbubble-outline" size={21} color={colors.text} />
        <Text style={styles.triggerText}>Feedback</Text>
      </Pressable>

      <BottomSheet
        index={open ? 0 : -1}
        enablePanDownToClose
        onClose={close}
        backgroundStyle={{ backgroundColor: colors.background }}
      >
        <BottomSheetView style={styles.sheet}>
          <BottomSheetScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>Give feedback</Text>
                <Text style={styles.description}>
                  Report a problem with this story line.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close feedback"
                hitSlop={10}
                onPress={close}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.triggerPressed,
                ]}
              >
                <Ionicons name="close" size={24} color={colors.textDim} />
              </Pressable>
            </View>

            <Text style={styles.eyebrow}>Current line</Text>
            {lineElement ? (
              <View style={styles.storyLinePreview}>
                <TextLine
                  element={lineElement}
                  active={false}
                  rtl={storyRtl}
                  autoPlay={false}
                />
              </View>
            ) : (
              <View style={styles.linePreview}>
                <Text style={styles.lineText}>
                  {lineText || `Story ${storyId}`}
                </Text>
              </View>
            )}

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {feedbackCategories.map((option) => {
                const selected = option.value === category;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                      disabled: formLocked,
                    }}
                    disabled={formLocked}
                    onPress={() => setCategory(option.value)}
                    style={({ pressed }) => [
                      styles.category,
                      selected && styles.categorySelected,
                      pressed && styles.triggerPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selected && styles.categoryTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!isSubmitted ? (
              <>
                <Text style={styles.label}>Comment</Text>
                <TextInput
                  accessibilityLabel="Feedback comment"
                  value={comment}
                  onChangeText={setComment}
                  editable={!formLocked}
                  multiline
                  maxLength={2000}
                  numberOfLines={5}
                  placeholder="What should be fixed?"
                  placeholderTextColor={colors.textDim}
                  textAlignVertical="top"
                  style={styles.comment}
                />
              </>
            ) : null}

            {submitError ? (
              <View style={styles.error} accessibilityRole="alert">
                <Text style={styles.errorText}>{submitError.message}</Text>
              </View>
            ) : null}
            {isSubmitted ? (
              <View style={styles.success}>
                <Ionicons
                  name="checkmark-circle"
                  size={23}
                  color={colors.greenDark}
                />
                <Text style={styles.successText}>
                  Thanks, your feedback was saved.
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              {!isSubmitted && !terminalRejection ? (
                <Button
                  title={isSubmitting || isTimedOut ? "Close" : "Cancel"}
                  variant="neutral"
                  onPress={close}
                  style={styles.cancelAction}
                  labelStyle={styles.actionLabel}
                />
              ) : null}
              <Button
                title={
                  isSubmitted
                    ? "Done"
                    : terminalRejection
                      ? "Close"
                      : isSubmitting
                        ? "Submitting"
                        : isTimedOut
                          ? "Try again"
                          : "Submit feedback"
                }
                disabled={
                  isSubmitting ||
                  (!isSubmitted &&
                    !terminalRejection &&
                    comment.trim().length === 0)
                }
                onPress={primaryActionCloses ? close : () => void submit()}
                style={styles.action}
                labelStyle={styles.actionLabel}
              />
            </View>
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    trigger: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
    },
    triggerDisabled: { opacity: 0 },
    triggerPressed: { opacity: 0.65 },
    triggerText: { color: colors.text, fontSize: 15, fontWeight: "800" },
    sheet: {
      flex: 1,
      backgroundColor: colors.background,
    },
    sheetContent: { paddingHorizontal: 20, paddingBottom: 24 },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    titleCopy: { flex: 1 },
    title: { color: colors.text, fontSize: 23, fontWeight: "800" },
    description: {
      color: colors.textDim,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 2,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    eyebrow: {
      color: colors.textDim,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginTop: 20,
    },
    linePreview: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 7,
    },
    storyLinePreview: { marginTop: 2 },
    lineText: { color: colors.text, fontSize: 16, lineHeight: 22 },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      marginTop: 18,
      marginBottom: 8,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 9,
    },
    category: {
      width: "48.7%",
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 13,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
    },
    categorySelected: {
      borderColor: colors.blueDark,
      backgroundColor: colors.blue,
    },
    categoryText: { color: colors.text, fontSize: 15, fontWeight: "800" },
    categoryTextSelected: { color: colors.primaryText },
    comment: {
      minHeight: 112,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    error: {
      borderWidth: 2,
      borderColor: colors.red,
      borderRadius: 12,
      backgroundColor: colors.redLight,
      paddingHorizontal: 14,
      paddingVertical: 11,
      marginTop: 14,
    },
    errorText: { color: colors.red, fontSize: 15, fontWeight: "700" },
    success: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      borderWidth: 2,
      borderColor: colors.green,
      borderRadius: 12,
      backgroundColor: colors.greenLight,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 18,
    },
    successText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    actions: { flexDirection: "row", gap: 10, marginTop: 18 },
    action: { flex: 1.3 },
    cancelAction: { flex: 0.8 },
    actionLabel: { fontSize: 14 },
  });
}
