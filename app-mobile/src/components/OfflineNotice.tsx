import React from "react";
import { StyleSheet, View } from "react-native";
import { type ThemeColors, useTheme } from "../theme";
import { Text } from "./Text";

export function OfflineNotice({ detail }: { detail?: string }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>You are offline</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
    },
    detail: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textDim,
      marginTop: 2,
    },
  });
}
