import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppState } from "../src/app-state";
import { CoursePicker } from "../src/components/CoursePicker";
import { Text } from "../src/components/Text";
import { type ThemeColors, useTheme } from "../src/theme";

export default function AddCourseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { courseShort, setCourseShort } = useAppState();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="chevron-back" size={28} color={colors.textDim} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Add course</Text>
          <Text style={styles.subtitle}>Choose another course to read</Text>
        </View>
      </View>
      <CoursePicker
        selectedShort={courseShort}
        onSelect={(course) => {
          void setCourseShort(course.short).then(() => {
            router.replace("/(tabs)");
          });
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textDim,
      marginTop: 2,
    },
  });
}
