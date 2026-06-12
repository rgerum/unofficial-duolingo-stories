import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { Button } from "../components/Button";
import { SmartImage } from "../components/SmartImage";

export type NextStoryPreview = {
  title: string;
  image: string;
};

/**
 * Bottom action bar, ported from the web's StoryFooter button-status machine:
 * wait (disabled), continue/idle, right (green "You are correct" stacked
 * above the button), finished. The Reader overlays it at the screen bottom
 * (like the web's fixed footer), so its height changes never shift the
 * transcript.
 */
export function Footer({
  status,
  onContinue,
  onBackToOverview,
  finishedLabel,
  nextStoryPreview,
  learningLanguageName,
}: {
  status: string;
  onContinue: () => void;
  onBackToOverview?: () => void;
  finishedLabel?: string;
  nextStoryPreview?: NextStoryPreview | null;
  learningLanguageName?: string;
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = { paddingBottom: Math.max(18, insets.bottom + 10) };

  if (status === "finished") {
    // Web layout: Back to overview, then the "Up next" preview card, then
    // the primary action — all full width.
    return (
      <View style={[styles.root, bottomPadding]}>
        <Button
          title="Back to overview"
          variant="neutral"
          onPress={onBackToOverview}
        />
        {nextStoryPreview && (
          <>
            <Text style={styles.upNext}>Up next</Text>
            <View style={styles.previewCard}>
              <SmartImage uri={nextStoryPreview.image} width={52} height={48} />
              <View style={styles.previewText}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {nextStoryPreview.title}
                </Text>
                <Text style={styles.previewSubtitle}>
                  {learningLanguageName
                    ? `Continue in ${learningLanguageName}`
                    : "Next story in this course"}
                </Text>
              </View>
            </View>
          </>
        )}
        <Button
          title={finishedLabel ?? "Finished"}
          onPress={onContinue}
          style={styles.finishedPrimary}
        />
      </View>
    );
  }

  const isRight = status === "right";
  return (
    <View style={[styles.root, bottomPadding, isRight && styles.rootRight]}>
      {isRight && <Text style={styles.rightText}>You are correct</Text>}
      <Button
        title={status === "..." ? "..." : "Continue"}
        disabled={status === "wait" || status === "..."}
        onPress={onContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  rootRight: {
    backgroundColor: colors.greenLight,
    borderTopColor: colors.greenLight,
    paddingTop: 28,
  },
  rightText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.greenDark,
    marginBottom: 20,
    marginLeft: 6,
  },
  upNext: {
    marginTop: 18,
    marginBottom: 8,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textDim,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 12,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  previewSubtitle: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 2,
  },
  finishedPrimary: {
    marginTop: 14,
  },
});
