import { Directory, File } from "expo-file-system";
import { Platform } from "react-native";
import { widgetsDirectory } from "expo-widgets";
import NextStoryWidget from "./NextStoryWidget";
import { findNextStory, type WidgetStory } from "./nextStory";

let syncGeneration = 0;

export async function syncNextStoryWidget({
  courseName,
  stories,
  doneStoryIds,
  listening,
}: {
  courseName: string;
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
    const imageFile = new File(directory, `next-story-${nextStory.id}.png`);
    const imageUrl = new URL("https://duostories.org/api/og-story");
    imageUrl.searchParams.set("title", nextStory.name);
    imageUrl.searchParams.set("name", courseName);
    imageUrl.searchParams.set("image", nextStory.image);
    await File.downloadFileAsync(imageUrl.toString(), imageFile, {
      idempotent: true,
    });
    if (generation !== syncGeneration) return;

    NextStoryWidget.updateSnapshot({
      ...snapshot,
      imagePath: imageFile.uri,
    });
  } catch {
    // Keep the last good snapshot if downloading the next card fails.
  }
}

export function clearNextStoryWidget(): void {
  syncGeneration += 1;
  if (Platform.OS === "ios") NextStoryWidget.updateSnapshot({ state: "empty" });
}
