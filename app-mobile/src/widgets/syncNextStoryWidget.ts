import { Directory, File } from "expo-file-system";
import { Platform } from "react-native";
import { widgetsDirectory } from "expo-widgets";
import NextStoryWidget from "./NextStoryWidget";
import { findNextStory, type WidgetStory } from "./nextStory";

// Transparent story character PNG, served directly by the Duolingo stories CDN.
const STORY_ICON_BASE = "https://stories-cdn.duolingo.com/image";
// Server-rendered flag PNG (matches the app's flags). Deployed with the PR;
// until then the download fails and the widget renders without the flag.
const WIDGET_FLAG_ENDPOINT = "https://duostories.org/api/widget-flag";

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
  NextStoryWidget.updateSnapshot(snapshot);

  try {
    const directory = new Directory(widgetsDirectory);
    if (!directory.exists) directory.create({ intermediates: true });

    const [imagePath, flagPath] = await Promise.all([
      downloadImage(
        directory,
        `next-story-${nextStory.id}.png`,
        `${STORY_ICON_BASE}/${nextStory.image}.png`,
      ),
      downloadFlag(directory, learningLanguageShort, flag, flagFile),
    ]);
    if (generation !== syncGeneration) return;

    NextStoryWidget.updateSnapshot({
      ...snapshot,
      ...(imagePath ? { imagePath } : {}),
      ...(flagPath ? { flagPath } : {}),
    });
  } catch {
    // Keep the last good snapshot if downloading the widget assets fails.
  }
}

async function downloadFlag(
  directory: Directory,
  learningLanguageShort: string | undefined,
  flag: number | string | undefined,
  flagFile: string | undefined,
): Promise<string | null> {
  const url = new URL(WIDGET_FLAG_ENDPOINT);
  let cacheKey: string;
  if (flagFile) {
    url.searchParams.set("flag_file", flagFile);
    cacheKey = flagFile.replace(/[^a-z0-9]/gi, "_");
  } else if (learningLanguageShort || flag !== undefined) {
    if (learningLanguageShort)
      url.searchParams.set("lang", learningLanguageShort);
    if (flag !== undefined) url.searchParams.set("flag", String(flag));
    cacheKey = learningLanguageShort || `flag-${flag}`;
  } else {
    return null;
  }
  return downloadImage(directory, `flag-${cacheKey}.png`, url.toString());
}

async function downloadImage(
  directory: Directory,
  fileName: string,
  url: string,
): Promise<string | null> {
  try {
    const file = new File(directory, fileName);
    await File.downloadFileAsync(url, file, { idempotent: true });
    return file.uri;
  } catch {
    return null;
  }
}

export function clearNextStoryWidget(): void {
  syncGeneration += 1;
  if (Platform.OS === "ios") NextStoryWidget.updateSnapshot({ state: "empty" });
}
