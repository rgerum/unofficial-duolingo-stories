import React from "react";
import { View, ViewStyle } from "react-native";
import { Image } from "expo-image";
// RemoteSvg sanitizes the markup (strips <title> text nodes that crash
// react-native-svg) and applies <style> CSS classes, which plain SvgUri
// ignores (everything renders black).
import { RemoteSvg } from "./RemoteSvg";

/**
 * Story illustrations come from stories-cdn.duolingo.com as SVGs; avatars are
 * usually raster. Pick the right renderer from the URL.
 */
export function SmartImage({
  uri,
  width,
  height,
  style,
}: {
  uri: string | undefined;
  width: number;
  height: number;
  style?: ViewStyle;
}) {
  if (!uri) return <View style={[{ width, height }, style]} />;

  // Extension-only detection assumes trusted Duolingo/duostories CDN URLs;
  // switch to content-type checks if untrusted image sources are introduced.
  const isSvg = uri.split("?")[0].toLowerCase().endsWith(".svg");
  return (
    <View style={[{ width, height }, style]}>
      {isSvg ? (
        <RemoteSvg uri={uri} width={width} height={height} />
      ) : (
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          transition={100}
        />
      )}
    </View>
  );
}
