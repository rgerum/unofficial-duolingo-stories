import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type ThemeColors, useTheme } from "../theme";
import { SmartImage } from "./SmartImage";
import { Text } from "./Text";

export type StoryListItem = {
  id: number;
  name: string;
  active: string;
  gilded: string;
  active_lip?: string;
  set_id: number;
  set_index: number;
};

// Geometry ported from the web's story_button.tsx: the artwork (135×124)
// overflows a 113×113 tile offset 11px in and lifted 5px, so the tile color
// only shows as a "lip" under the artwork's own rounded square.
const ART_WIDTH = 135;
const ART_HEIGHT = 124;
const TILE_SIZE = 113;
const TILE_INSET = 11;
const LIFT = 5;

export function StoryButton({
  story,
  done,
  listeningMode,
  onPress,
  disabled = false,
}: {
  story: StoryListItem;
  done: boolean;
  listeningMode: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={story.name}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.8 },
      ]}
    >
      <View style={styles.artBox}>
        <View
          style={[
            styles.tile,
            {
              backgroundColor: done
                ? colors.gold
                : `#${story.active_lip ?? "000000"}`,
            },
          ]}
        />
        <SmartImage
          uri={done ? story.gilded : story.active}
          width={ART_WIDTH}
          height={ART_HEIGHT}
          style={styles.art}
        />
        {listeningMode && (
          <View style={styles.listeningBadge}>
            <Ionicons name="volume-medium" size={13} color={colors.blueDark} />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {story.name}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  root: {
    width: ART_WIDTH,
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 8,
  },
  disabled: {
    opacity: 0.45,
  },
  artBox: {
    width: ART_WIDTH,
    height: ART_HEIGHT + LIFT,
  },
  tile: {
    position: "absolute",
    left: TILE_INSET,
    top: TILE_INSET + LIFT,
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 17,
  },
  art: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  listeningBadge: {
    position: "absolute",
    top: TILE_INSET + LIFT + 5,
    right: TILE_INSET + 5,
    zIndex: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textDim,
  },
  });
}
