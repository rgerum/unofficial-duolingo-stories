import { Directory, File } from "expo-file-system";
import { Platform } from "react-native";
import { widgetsDirectory } from "expo-widgets";
import NextStoryWidget from "./NextStoryWidget";
import { findNextStory, type WidgetStory } from "./nextStory";

// Transparent story character PNG, served directly by the Duolingo stories CDN.
const STORY_ICON_BASE = "https://stories-cdn.duolingo.com/image";
// Server-rendered flag PNG, so the widget shows the same flags as the app.
const WIDGET_FLAG_ENDPOINT = "https://duostories.org/api/widget-flag";
const STORY_IMAGE_PREFIX = "next-story-";

type WidgetAsset = { fileName: string; url: string };

let syncGeneration = 0;

export async function syncNextStoryWidget({
  courseName,
  learningLanguageShort,
  flag,
  flagFile,
  stories,
  doneStoryIds,
  listening,
}: {
  courseName: string;
  learningLanguageShort?: string;
  flag?: number | string;
  flagFile?: string;
  stories: WidgetStory[];
  doneStoryIds: ReadonlySet<number>;
  listening: boolean;
}): Promise<void> {
  if (Platform.OS !== "ios" || !widgetsDirectory) return;

  const generation = ++syncGeneration;

  const nextStory = findNextStory(stories, doneStoryIds);
  if (!nextStory) {
    NextStoryWidget.updateSnapshot({ state: "complete", courseName });
    return;
  }

  const snapshot = {
    state: "ready" as const,
    storyId: nextStory.id,
    storyName: nextStory.name,
    courseName,
    listening,
    completedCount: nextStory.completedCount,
    totalCount: nextStory.totalCount,
  };

  const directory = openWidgetsDirectory();
  // Keyed by artwork hash as well as story id, so replaced artwork is fetched
  // again instead of being served from a stale cache entry.
  const storyAsset: WidgetAsset = {
    fileName: `${STORY_IMAGE_PREFIX}${nextStory.id}-${sanitize(nextStory.image)}.png`,
    url: `${STORY_ICON_BASE}/${nextStory.image}.png`,
  };
  const flagAsset = resolveFlagAsset(learningLanguageShort, flag, flagFile);

  // Publish whatever is already on disk first so the widget does not flash
  // without artwork while the downloads run.
  const cachedImage = directory && cachedUri(directory, storyAsset.fileName);
  const cachedFlag =
    directory && flagAsset && cachedUri(directory, flagAsset.fileName);
  NextStoryWidget.updateSnapshot({
    ...snapshot,
    ...(cachedImage ? { imagePath: cachedImage } : {}),
    ...(cachedFlag ? { flagPath: cachedFlag } : {}),
  });

  if (!directory) return;
  if (cachedImage && (cachedFlag || !flagAsset)) {
    pruneStaleStoryImages(directory, storyAsset.fileName);
    return;
  }

  try {
    const [imagePath, flagPath] = await Promise.all([
      cachedImage ?? downloadImage(directory, storyAsset),
      cachedFlag ??
        (flagAsset
          ? downloadImage(directory, flagAsset)
          : Promise.resolve(null)),
    ]);
    if (generation !== syncGeneration) return;

    NextStoryWidget.updateSnapshot({
      ...snapshot,
      ...(imagePath ? { imagePath } : {}),
      ...(flagPath ? { flagPath } : {}),
    });
    pruneStaleStoryImages(directory, storyAsset.fileName);
  } catch (error) {
    // Keep the last good snapshot if refreshing the widget assets fails.
    console.warn("Failed to refresh next-story widget assets", error);
  }
}

function openWidgetsDirectory(): Directory | null {
  try {
    const directory = new Directory(widgetsDirectory as string);
    if (!directory.exists) directory.create({ intermediates: true });
    return directory;
  } catch (error) {
    console.warn("Widget assets directory unavailable", error);
    return null;
  }
}

function resolveFlagAsset(
  learningLanguageShort: string | undefined,
  flag: number | string | undefined,
  flagFile: string | undefined,
): WidgetAsset | null {
  const url = new URL(WIDGET_FLAG_ENDPOINT);
  let cacheKey: string;
  if (flagFile) {
    url.searchParams.set("flag_file", flagFile);
    cacheKey = sanitize(flagFile);
  } else if (learningLanguageShort || flag !== undefined) {
    // The key has to cover every parameter that changes the rendered flag,
    // otherwise two languages sharing an iso would reuse one cached file.
    const parts: string[] = [];
    if (learningLanguageShort) {
      url.searchParams.set("lang", learningLanguageShort);
      parts.push(learningLanguageShort);
    }
    if (flag !== undefined) {
      url.searchParams.set("flag", String(flag));
      parts.push(`flag-${flag}`);
    }
    cacheKey = sanitize(parts.join("-"));
  } else {
    return null;
  }
  return { fileName: `flag-${cacheKey}.png`, url: url.toString() };
}

function cachedUri(directory: Directory, fileName: string): string | null {
  try {
    const file = new File(directory, fileName);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/** Removes artwork for stories the widget no longer shows. */
function pruneStaleStoryImages(
  directory: Directory,
  keepFileName: string,
): void {
  try {
    for (const entry of directory.list()) {
      if (!(entry instanceof File)) continue;
      if (!entry.name.startsWith(STORY_IMAGE_PREFIX)) continue;
      if (entry.name === keepFileName) continue;
      entry.delete();
    }
  } catch (error) {
    console.warn("Failed to prune stale next-story widget images", error);
  }
}

async function downloadImage(
  directory: Directory,
  asset: WidgetAsset,
): Promise<string | null> {
  try {
    const file = new File(directory, asset.fileName);
    await File.downloadFileAsync(asset.url, file, { idempotent: true });
    return file.uri;
  } catch (error) {
    console.warn(`Failed to download widget asset ${asset.url}`, error);
    return null;
  }
}

function sanitize(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "_");
}

export function clearNextStoryWidget(): void {
  syncGeneration += 1;
  if (Platform.OS === "ios") NextStoryWidget.updateSnapshot({ state: "empty" });
}
