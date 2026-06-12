import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppState } from "../src/app-state";
import { CoursePicker } from "../src/components/CoursePicker";
import { colors } from "../src/theme";

export default function Onboarding() {
  const router = useRouter();
  const { setCourseShort, setHasSeenWelcome } = useAppState();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick a course</Text>
        <Text style={styles.subtitle}>
          Choose the language you want to read stories in. You can switch any
          time.
        </Text>
      </View>
      <CoursePicker
        onSelect={(course) => {
          setCourseShort(course.short);
          setHasSeenWelcome(true);
          router.replace("/(tabs)");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textDim,
    marginTop: 6,
  },
});
