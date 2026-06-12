import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppState } from "../../src/app-state";
import { CoursePicker } from "../../src/components/CoursePicker";
import { colors } from "../../src/theme";

export default function CoursesTab() {
  const router = useRouter();
  const { courseShort, setCourseShort } = useAppState();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
      </View>
      <CoursePicker
        selectedShort={courseShort}
        onSelect={(course) => {
          setCourseShort(course.short);
          router.navigate("/(tabs)");
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
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
});
