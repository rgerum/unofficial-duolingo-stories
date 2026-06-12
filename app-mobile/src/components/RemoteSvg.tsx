import React from "react";
import { View } from "react-native";
import { SvgCss } from "react-native-svg/css";

// Renders remote SVGs from text instead of SvgCssUri so the markup can be
// sanitized first: Duolingo's assets contain <title> elements whose text
// nodes crash react-native-svg ("Text strings must be rendered within a
// <Text> component").

const cache = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();
const listeners = new Map<string, Set<() => void>>();

/**
 * Without a viewBox, react-native-svg draws content at its intrinsic
 * coordinate size instead of scaling to the requested width/height (several
 * duostories flag files declare only width="78" height="62"). Derive one.
 */
function ensureViewBox(xml: string): string {
  const rootMatch = xml.match(/<svg[^>]*>/);
  if (!rootMatch) return xml;
  const root = rootMatch[0];
  if (/viewBox=/.test(root)) return xml;
  const width = root.match(/\swidth="([\d.]+)(?:px)?"/);
  const height = root.match(/\sheight="([\d.]+)(?:px)?"/);
  if (!width || !height) return xml;
  return xml.replace(
    root,
    root.replace("<svg", `<svg viewBox="0 0 ${width[1]} ${height[1]}"`),
  );
}

export function sanitizeSvg(xml: string): string {
  return ensureViewBox(
    xml
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<!DOCTYPE[\s\S]*?>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<title[\s\S]*?<\/title>/g, "")
      .replace(/<desc[\s\S]*?<\/desc>/g, "")
      .trim(),
  );
}

function fetchSvg(url: string): Promise<string | null> {
  const existing = pending.get(url);
  if (existing) return existing;
  const promise = fetch(url)
    .then((response) => (response.ok ? response.text() : null))
    .then((text) => (text ? sanitizeSvg(text) : null))
    .catch(() => null)
    .then((result) => {
      cache.set(url, result);
      pending.delete(url);
      listeners.get(url)?.forEach((listener) => listener());
      listeners.delete(url);
      return result;
    });
  pending.set(url, promise);
  return promise;
}

/** Sanitized SVG markup for a URL; null while loading or on failure. */
export function useSvgXml(url: string | undefined): string | null {
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    if (!url || cache.has(url)) return;
    let mounted = true;
    const listener = () => {
      if (mounted) forceRender();
    };
    const set = listeners.get(url) ?? new Set();
    set.add(listener);
    listeners.set(url, set);
    void fetchSvg(url);
    return () => {
      mounted = false;
      set.delete(listener);
    };
  }, [url]);

  if (!url) return null;
  return cache.get(url) ?? null;
}

export function RemoteSvg({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  const xml = useSvgXml(uri);
  if (!xml) return <View style={{ width, height }} />;
  return <SvgCss xml={xml} width={width} height={height} />;
}
