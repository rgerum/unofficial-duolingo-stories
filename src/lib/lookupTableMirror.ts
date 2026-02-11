import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

type LanguageRow = {
  id?: number;
  name?: string;
  short?: string;
  flag?: number | null;
  flag_file?: string | null;
  speaker?: string | null;
  default_text?: string | null;
  tts_replace?: string | null;
  public?: boolean;
  rtl?: boolean;
};

function optionalString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function optionalNumber(value: number | null | undefined): number | undefined {
  return value ?? undefined;
}

function optionalBoolean(value: boolean | null | undefined): boolean | undefined {
  return value ?? undefined;
}

const RETRY_DELAYS_MS = [150, 500, 1200] as const;

async function retryMirror<T>(fn: () => Promise<T>, operationKey: string) {
  let lastError: unknown;

  for (const delayMs of RETRY_DELAYS_MS) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  try {
    return await fn();
  } catch (error) {
    lastError = error;
  }

  console.error("[mirror.lookup.failed]", {
    operationKey,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw new Error(`Convex mirror failed for ${operationKey}`);
}

export async function mirrorLanguage(row: LanguageRow, operationKey: string) {
  if (
    typeof row.id !== "number" ||
    typeof row.name !== "string" ||
    typeof row.short !== "string"
  ) {
    const details = {
      operationKey,
      row,
    };
    console.error("[mirror.lookup.skip.invalid_language_row]", details);
    throw new Error(
      `Convex mirror rejected invalid language row for ${operationKey}`,
    );
  }

  return retryMirror(
    () =>
      fetchAuthMutation((api as any).lookupTables.upsertLanguage, {
        language: {
          legacyId: row.id,
          name: row.name,
          short: row.short,
          flag: optionalNumber(row.flag),
          flag_file: optionalString(row.flag_file),
          speaker: optionalString(row.speaker),
          default_text: optionalString(row.default_text),
          tts_replace: optionalString(row.tts_replace),
          public: Boolean(row.public),
          rtl: Boolean(row.rtl),
        },
        operationKey,
      }),
    operationKey,
  );
}

type SpeakerRow = {
  id?: number;
  language_id?: number | null;
  speaker?: string | null;
  gender?: string | null;
  type?: string | null;
  service?: string | null;
};

export async function mirrorSpeaker(row: SpeakerRow, operationKey: string) {
  if (
    typeof row.language_id !== "number" ||
    typeof row.speaker !== "string" ||
    typeof row.gender !== "string" ||
    typeof row.type !== "string" ||
    typeof row.service !== "string"
  ) {
    throw new Error(`Convex mirror rejected invalid speaker row for ${operationKey}`);
  }

  return retryMirror(
    () =>
      fetchAuthMutation((api as any).lookupTables.upsertSpeaker, {
        speaker: {
          legacyId: optionalNumber(row.id),
          legacyLanguageId: row.language_id,
          speaker: row.speaker,
          gender: row.gender,
          type: row.type,
          service: row.service,
        },
        operationKey,
      }),
    operationKey,
  );
}

type LocalizationRow = {
  id?: number;
  language_id?: number | null;
  tag?: string | null;
  text?: string | null;
};

export async function mirrorLocalization(
  row: LocalizationRow,
  operationKey: string,
) {
  if (
    typeof row.language_id !== "number" ||
    typeof row.tag !== "string" ||
    typeof row.text !== "string"
  ) {
    throw new Error(
      `Convex mirror rejected invalid localization row for ${operationKey}`,
    );
  }

  return retryMirror(
    () =>
      fetchAuthMutation((api as any).lookupTables.upsertLocalization, {
        localization: {
          legacyId: optionalNumber(row.id),
          legacyLanguageId: row.language_id,
          tag: row.tag,
          text: row.text,
        },
        operationKey,
      }),
    operationKey,
  );
}

type CourseRow = {
  id?: number;
  short?: string | null;
  learning_language?: number | null;
  from_language?: number | null;
  public?: boolean | null;
  official?: boolean | number | null;
  name?: string | null;
  about?: string | null;
  conlang?: boolean | null;
  tags?: string[] | null;
  count?: number | null;
  learning_language_name?: string | null;
  from_language_name?: string | null;
  contributors?: string[] | null;
  contributors_past?: string[] | null;
  todo_count?: number | null;
};

export async function mirrorCourse(row: CourseRow, operationKey: string) {
  if (
    typeof row.id !== "number" ||
    typeof row.learning_language !== "number" ||
    typeof row.from_language !== "number"
  ) {
    throw new Error(`Convex mirror rejected invalid course row for ${operationKey}`);
  }

  return retryMirror(
    () =>
      fetchAuthMutation((api as any).lookupTables.upsertCourse, {
        course: {
          legacyId: row.id,
          short: optionalString(row.short),
          legacyLearningLanguageId: row.learning_language,
          legacyFromLanguageId: row.from_language,
          public: Boolean(row.public),
          official:
            typeof row.official === "number"
              ? row.official !== 0
              : Boolean(row.official),
          name: optionalString(row.name),
          about: optionalString(row.about),
          conlang: optionalBoolean(row.conlang),
          tags: row.tags ?? undefined,
          count: optionalNumber(row.count),
          learning_language_name: optionalString(row.learning_language_name),
          from_language_name: optionalString(row.from_language_name),
          contributors: row.contributors ?? undefined,
          contributors_past: row.contributors_past ?? undefined,
          todo_count: optionalNumber(row.todo_count),
        },
        operationKey,
      }),
    operationKey,
  );
}

type AvatarMappingRow = {
  id?: number;
  avatar_id?: number | null;
  language_id?: number | null;
  name?: string | null;
  speaker?: string | null;
};

export async function mirrorAvatarMapping(
  row: AvatarMappingRow,
  operationKey: string,
) {
  if (typeof row.avatar_id !== "number" || typeof row.language_id !== "number") {
    throw new Error(
      `Convex mirror rejected invalid avatar mapping row for ${operationKey}`,
    );
  }

  return retryMirror(
    () =>
      fetchAuthMutation((api as any).lookupTables.upsertAvatarMapping, {
        avatarMapping: {
          legacyId: optionalNumber(row.id),
          legacyAvatarId: row.avatar_id,
          legacyLanguageId: row.language_id,
          name: optionalString(row.name),
          speaker: optionalString(row.speaker),
        },
        operationKey,
      }),
    operationKey,
  );
}

type StoryRow = {
  id?: number;
  duo_id?: string | null;
  name?: string | null;
  set_id?: number | null;
  set_index?: number | null;
  author?: number | null;
  author_change?: number | null;
  date?: Date | string | number | null;
  change_date?: Date | string | number | null;
  date_published?: Date | string | number | null;
  text?: string | null;
  public?: boolean | null;
  image?: string | null;
  course_id?: number | null;
  json?: unknown;
  status?: "draft" | "feedback" | "finished" | string | null;
  deleted?: boolean | null;
  todo_count?: number | null;
};

function optionalTimestampMs(
  value: Date | string | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const timestamp =
    value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function mirrorStory(
  row: StoryRow,
  operationKey: string,
  options?: { mirrorContent?: boolean },
) {
  if (
    typeof row.id !== "number" ||
    typeof row.name !== "string" ||
    typeof row.course_id !== "number"
  ) {
    throw new Error(`Convex mirror rejected invalid story row for ${operationKey}`);
  }

  const status =
    row.status === "draft" || row.status === "feedback" || row.status === "finished"
      ? row.status
      : "draft";
  const legacyStoryId = row.id;
  const storyName = row.name;
  const legacyCourseId = row.course_id;

  await retryMirror(
    () =>
      fetchAuthMutation(api.storyTables.upsertStory, {
        story: {
          legacyId: legacyStoryId,
          duo_id: optionalString(row.duo_id),
          name: storyName,
          set_id: optionalNumber(row.set_id),
          set_index: optionalNumber(row.set_index),
          authorId: optionalNumber(row.author),
          authorChangeId: optionalNumber(row.author_change),
          date: optionalTimestampMs(row.date),
          change_date: optionalTimestampMs(row.change_date),
          date_published: optionalTimestampMs(row.date_published),
          public: row.public ?? false,
          legacyImageId: optionalString(row.image),
          legacyCourseId,
          status,
          deleted: row.deleted ?? false,
          todo_count: row.todo_count ?? 0,
        },
        operationKey,
      }),
    operationKey,
  );

  if (!options?.mirrorContent) return;
  await mirrorStoryContent(row, `${operationKey}:content`);
}

export async function mirrorStoryContent(row: StoryRow, operationKey: string) {
  if (typeof row.id !== "number" || typeof row.text !== "string") {
    throw new Error(
      `Convex mirror rejected invalid story content row for ${operationKey}`,
    );
  }
  const jsonValue = parseJsonLike(row.json);
  if (jsonValue === undefined) {
    throw new Error(
      `Convex mirror rejected missing story content json for ${operationKey}`,
    );
  }
  const legacyStoryId = row.id;
  const storyText = row.text;

  return retryMirror(
    () =>
      fetchAuthMutation(api.storyTables.upsertStoryContent, {
        storyContent: {
          legacyStoryId,
          text: storyText,
          json: jsonValue,
          lastUpdated:
            optionalTimestampMs(row.change_date) ??
            optionalTimestampMs(row.date) ??
            Date.now(),
        },
        operationKey,
      }),
    operationKey,
  );
}

export async function mirrorStoryDone(
  row: {
    story_id?: number | null;
    user_id?: number | null;
    time?: Date | string | number | null;
  },
  operationKey: string,
) {
  if (typeof row.story_id !== "number") {
    throw new Error(`Convex mirror rejected invalid story_done row for ${operationKey}`);
  }

  const legacyStoryId = row.story_id;
  return retryMirror(
    () =>
      fetchAuthMutation(api.storyDone.recordStoryDone, {
        legacyStoryId,
        legacyUserId: optionalNumber(row.user_id),
        time: optionalTimestampMs(row.time),
      }),
    operationKey,
  );
}

export async function mirrorStoryApprovalUpsert(
  row: {
    id?: number | null;
    story_id?: number | null;
    user_id?: number | null;
    date?: Date | string | number | null;
  },
  operationKey: string,
) {
  if (typeof row.story_id !== "number" || typeof row.user_id !== "number") {
    throw new Error(
      `Convex mirror rejected invalid story_approval row for ${operationKey}`,
    );
  }
  const legacyStoryId = row.story_id;
  const legacyUserId = row.user_id;

  return retryMirror(
    () =>
      fetchAuthMutation(api.storyApproval.upsertStoryApproval, {
        legacyStoryId,
        legacyUserId,
        date: optionalTimestampMs(row.date),
        legacyApprovalId: optionalNumber(row.id),
      }),
    operationKey,
  );
}

export async function mirrorStoryApprovalDelete(
  row: {
    story_id?: number | null;
    user_id?: number | null;
  },
  operationKey: string,
) {
  if (typeof row.story_id !== "number" || typeof row.user_id !== "number") {
    throw new Error(
      `Convex mirror rejected invalid story_approval delete row for ${operationKey}`,
    );
  }
  const legacyStoryId = row.story_id;
  const legacyUserId = row.user_id;

  return retryMirror(
    () =>
      fetchAuthMutation(api.storyApproval.deleteStoryApproval, {
        legacyStoryId,
        legacyUserId,
      }),
    operationKey,
  );
}

export async function mirrorStoryApprovalDeleteByLegacyId(
  legacyApprovalId: number,
  operationKey: string,
) {
  if (!Number.isFinite(legacyApprovalId)) {
    throw new Error(
      `Convex mirror rejected invalid story_approval legacy id for ${operationKey}`,
    );
  }

  return retryMirror(
    () =>
      fetchAuthMutation(api.storyApproval.deleteStoryApprovalByLegacyId, {
        legacyApprovalId,
      }),
    operationKey,
  );
}
