import AsyncStorage from "@react-native-async-storage/async-storage";

// All keys used by the app. Local progress mirrors the server's story_done
// table so it can be replayed through `recordStoryDone` once accounts land.
export const STORAGE_KEYS = {
  hasSeenWelcome: "hasSeenWelcome",
  hasAcceptedDisclaimer: "hasAcceptedDisclaimer",
  currentCourse: "currentCourseShort",
  activeCourses: "activeCourseShorts",
  hideStoryQuestions: "hideStoryQuestions",
  themePreference: "themePreference",
  analyticsInstallationId: "analyticsInstallationId",
  reviewPromptState: "reviewPromptState",
  pendingReviewPromptCompletion: "pendingReviewPromptCompletion",
};

const doneKey = (courseShort: string) => `doneStories:${courseShort}`;
const listeningKey = (courseShort: string) => `listening:${courseShort}`;

export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // best effort — local-only state
  }
}

export async function removeKeys(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // best effort — local-only state
  }
}

export async function getStringArray(key: string): Promise<string[]> {
  const raw = await getString(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export async function setStringArray(
  key: string,
  value: string[],
): Promise<void> {
  const unique = Array.from(new Set(value.filter(Boolean)));
  await setString(key, JSON.stringify(unique));
}

export async function getBool(key: string): Promise<boolean> {
  return (await getString(key)) === "1";
}

export async function setBool(key: string, value: boolean): Promise<void> {
  await setString(key, value ? "1" : "0");
}

/** Map of story legacyId -> completion timestamp (ms). */
export type DoneMap = Record<string, number>;
export type DoneStoryProgress = {
  courseShort: string;
  storyId: number;
  time: number;
};
export type CourseProgress = {
  completedCount: number;
  lastCompletedAt: number;
};

export async function getDoneMap(courseShort: string): Promise<DoneMap> {
  const raw = await getString(doneKey(courseShort));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

export async function markStoryDone(
  courseShort: string,
  storyId: number,
): Promise<DoneMap> {
  const map = await getDoneMap(courseShort);
  if (!map[String(storyId)]) {
    map[String(storyId)] = Date.now();
    await setString(doneKey(courseShort), JSON.stringify(map));
  }
  return map;
}

export async function clearDoneMap(courseShort: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(doneKey(courseShort));
  } catch {}
}

/** Returns { courseShort: completedCount } across all courses with progress. */
export async function getAllProgress(): Promise<Record<string, number>> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const doneKeys = keys.filter((key) => key.startsWith("doneStories:"));
    const result: Record<string, number> = {};
    for (const key of doneKeys) {
      const courseShort = key.slice("doneStories:".length);
      const map = await getDoneMap(courseShort);
      const count = Object.keys(map).length;
      if (count > 0) result[courseShort] = count;
    }
    return result;
  } catch {
    return {};
  }
}

export async function getAllCourseProgress(): Promise<
  Record<string, CourseProgress>
> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const doneKeys = keys.filter((key) => key.startsWith("doneStories:"));
    const result: Record<string, CourseProgress> = {};
    for (const key of doneKeys) {
      const courseShort = key.slice("doneStories:".length);
      const map = await getDoneMap(courseShort);
      const times = Object.values(map).filter(Number.isFinite);
      if (times.length === 0) continue;
      result[courseShort] = {
        completedCount: times.length,
        lastCompletedAt: Math.max(...times),
      };
    }
    return result;
  } catch {
    return {};
  }
}

export async function getAllDoneStories(): Promise<DoneStoryProgress[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const doneKeys = keys.filter((key) => key.startsWith("doneStories:"));
    const result: DoneStoryProgress[] = [];
    for (const key of doneKeys) {
      const courseShort = key.slice("doneStories:".length);
      const map = await getDoneMap(courseShort);
      for (const [storyIdText, time] of Object.entries(map)) {
        const storyId = Number(storyIdText);
        if (!Number.isFinite(storyId) || !Number.isFinite(time)) continue;
        result.push({ courseShort, storyId, time });
      }
    }
    return result;
  } catch {
    return [];
  }
}

export async function clearAllProgress(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(
      keys.filter((key) => key.startsWith("doneStories:")),
    );
  } catch {}
}

export async function getListeningMode(courseShort: string): Promise<boolean> {
  return getBool(listeningKey(courseShort));
}

export async function setListeningMode(
  courseShort: string,
  value: boolean,
): Promise<void> {
  await setBool(listeningKey(courseShort), value);
}
