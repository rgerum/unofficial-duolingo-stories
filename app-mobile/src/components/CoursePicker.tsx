import React from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../api";
import { useNetworkStatus } from "../network";
import { colors } from "../theme";
import { Flag } from "./Flag";
import { OfflineNotice } from "./OfflineNotice";
import { Text, TextInput } from "./Text";

type LandingData = FunctionReturnType<typeof api.landing.getPublicLandingPageData>;
type LandingGroup = LandingData["groups"][number];
type CourseItem = LandingGroup["courses"][number];

/**
 * Course list grouped by base language ("Stories for English", …), fed by the
 * same landing-page query as the web. English group comes first server-side.
 */
export function CoursePicker({
  selectedShort,
  onSelect,
}: {
  selectedShort?: string | null;
  onSelect: (course: { short: string; name: string }) => void;
}) {
  const data = useQuery(api.landing.getPublicLandingPageData);
  const { isOffline } = useNetworkStatus();
  const [search, setSearch] = React.useState("");

  if (!data) {
    if (isOffline) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>You're offline</Text>
          <Text style={styles.empty}>
            Connect to the internet to load the course list.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  const query = search.trim().toLowerCase();
  const sections = data.groups
    .map((group: LandingGroup) => {
      const courses: CourseItem[] = group.courses.filter(
        (course) =>
          !query ||
          course.name.toLowerCase().includes(query) ||
          course.learningLanguage.short.toLowerCase().includes(query) ||
          group.fromLanguageName.toLowerCase().includes(query),
      );
      return {
        key: String(group.fromLanguageId),
        title: `${group.labels.storiesFor} ${group.fromLanguageName}`,
        template: group.labels.nStoriesTemplate,
        data: courses,
      };
    })
    .filter((section) => section.data.length > 0);

  return (
    <View style={styles.root}>
      {isOffline ? (
        <View style={styles.offlineWrap}>
          <OfflineNotice detail="Connect to the internet to pick a course." />
        </View>
      ) : null}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textDim} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search languages"
          placeholderTextColor={colors.disabled}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {search.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearch("")}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.disabled} />
          </Pressable>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.short}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>No courses match "{search.trim()}"</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item, section }) => {
          const selected = item.short === selectedShort;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={isOffline}
              onPress={() => onSelect({ short: item.short, name: item.name })}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                isOffline && styles.rowDisabled,
                pressed && !isOffline && { opacity: 0.7 },
              ]}
            >
              <Flag
                iso={item.learningLanguage.short}
                flag={item.learningLanguage.flag}
                flag_file={item.learningLanguage.flag_file}
                width={48}
              />
              <View style={styles.rowText}>
                <Text style={styles.courseName}>{item.name}</Text>
                <Text style={styles.courseCount}>
                  {section.template.replace("$count", String(item.count))}
                </Text>
              </View>
              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.green}
                />
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  offlineWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  empty: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 16,
    color: colors.textDim,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueLight,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowText: {
    flex: 1,
  },
  courseName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  courseCount: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 2,
  },
});
