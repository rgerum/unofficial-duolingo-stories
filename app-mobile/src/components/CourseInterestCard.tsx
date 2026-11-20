import { useMutation, useQuery } from "convex/react";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { api } from "../api";
import { getString, setString } from "../storage";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Text } from "./Text";

const source =
  Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";

const pendingIds = new Map<string, Promise<string>>();

function getAnonymousId(courseShort: string) {
  const pending = pendingIds.get(courseShort);
  if (pending) return pending;

  const key = `courseInterestSupporter:${courseShort}`;
  const load = getString(key)
    .then(async (existing) => {
      if (existing) return existing;
      const id = `mobile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
      await setString(key, id);
      return id;
    })
    .finally(() => pendingIds.delete(courseShort));
  pendingIds.set(courseShort, load);
  return load;
}

export function CourseInterestCard({
  courseShort,
  languageName,
}: {
  courseShort: string;
  languageName: string;
}) {
  const { colors } = useTheme();
  const [anonymousId, setAnonymousId] = React.useState<string>();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);
  const setInterest = useMutation(api.courseInterest.setForLearner);
  const interest = useQuery(
    api.courseInterest.getForLearner,
    anonymousId ? { courseShort, anonymousId } : "skip",
  );

  React.useEffect(() => {
    void getAnonymousId(courseShort).then(setAnonymousId);
  }, [courseShort]);

  if (!interest || !anonymousId) return null;

  async function toggleInterest() {
    if (!interest || !anonymousId || saving) return;
    setSaving(true);
    setError(false);
    try {
      await setInterest({
        courseShort,
        anonymousId,
        interested: !interest.interested,
        source,
      });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.green },
      ]}
    >
      <Text accessibilityRole="header" style={styles.title}>
        {interest.interested
          ? "Thanks for showing your interest!"
          : `Want more ${languageName} stories?`}
      </Text>
      <Text style={[styles.body, { color: colors.textDim }]}>
        Your signal helps volunteer contributors see that learners are waiting
        for more.
      </Text>
      <Button
        title={
          interest.interested ? "Undo my request" : "I’d love more stories"
        }
        variant={interest.interested ? "neutral" : "primary"}
        disabled={saving}
        onPress={toggleInterest}
      />
      {error && (
        <Text
          accessibilityRole="alert"
          style={[styles.body, { color: colors.red }]}
        >
          Couldn’t update your request. Please try again.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    marginBottom: 4,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
