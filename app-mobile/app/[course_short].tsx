import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../src/api";
import { useAppState } from "../src/app-state";
import { useNetworkStatus } from "../src/network";
import { Button } from "../src/components/Button";
import { Text } from "../src/components/Text";
import { type ThemeColors, useTheme } from "../src/theme";

function getCourseShortParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CourseDeepLinkScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ course_short?: string | string[] }>();
  const linkedCourseShort = getCourseShortParam(params.course_short);
  const {
    ready,
    hasSeenWelcome,
    hasAcceptedDisclaimer,
    setCourseShort,
  } = useAppState();
  const { isOffline } = useNetworkStatus();
  const landingData = useQuery(api.landing.getPublicLandingPageData);
  const [hasStartedCourseSelection, setHasStartedCourseSelection] =
    React.useState(false);

  const linkedCourse = React.useMemo(() => {
    if (!landingData || !linkedCourseShort) return null;
    for (const group of landingData.groups) {
      const course = group.courses.find(
        (candidate) => candidate.short === linkedCourseShort,
      );
      if (course) return course;
    }
    return null;
  }, [landingData, linkedCourseShort]);

  React.useEffect(() => {
    if (!ready || !landingData || !linkedCourse || hasStartedCourseSelection) {
      return;
    }

    setHasStartedCourseSelection(true);
    void setCourseShort(linkedCourse.short).then(() => {
      router.replace(
        hasSeenWelcome && hasAcceptedDisclaimer ? "/(tabs)" : "/",
      );
    });
  }, [
    hasAcceptedDisclaimer,
    hasSeenWelcome,
    landingData,
    linkedCourse,
    ready,
    router,
    hasStartedCourseSelection,
    setCourseShort,
  ]);

  if (!linkedCourseShort) return <Redirect href="/" />;

  if (!ready || (!landingData && !isOffline) || linkedCourse) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (isOffline && !landingData) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.body}>
          Connect to the internet to open this course.
        </Text>
        <Button
          title="Go home"
          variant="secondary"
          onPress={() => router.replace("/")}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Course not available</Text>
      <Text style={styles.body}>
        This link does not match an available Duostories course.
      </Text>
      <Button
        title="Pick a course"
        onPress={() => router.replace("/add-course")}
        style={styles.button}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      paddingHorizontal: 28,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    body: {
      marginTop: 10,
      fontSize: 16,
      lineHeight: 24,
      color: colors.textDim,
      textAlign: "center",
    },
    button: {
      marginTop: 18,
      alignSelf: "stretch",
    },
  });
}
