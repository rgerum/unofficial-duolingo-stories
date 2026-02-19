import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

type LanguageDoc = Doc<"languages">;
type CourseDoc = Doc<"courses">;
type StoryDoc = Doc<"stories">;
type AvatarDoc = Doc<"avatars">;
type AvatarMappingDoc = Doc<"avatar_mappings">;

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toLanguage(language: LanguageDoc) {
  return {
    id: language.legacyId,
    name: language.name,
    short: language.short,
    flag:
      typeof language.flag === "number"
        ? language.flag
        : Number.isFinite(Number(language.flag))
          ? Number(language.flag)
          : null,
    flag_file: language.flag_file ?? null,
    speaker: language.speaker ?? null,
    default_text: language.default_text ?? "",
    tts_replace: language.tts_replace ?? null,
    public: language.public,
    rtl: language.rtl,
  };
}

function toCourse(
  course: CourseDoc,
  languageById: Map<Id<"languages">, LanguageDoc>,
) {
  const learningLanguage = languageById.get(course.learningLanguageId);
  const fromLanguage = languageById.get(course.fromLanguageId);

  return {
    id: course.legacyId,
    short: course.short ?? null,
    about: course.about ?? null,
    official: course.official,
    count: course.count ?? 0,
    public: course.public,
    from_language: fromLanguage?.legacyId ?? 0,
    from_language_name: fromLanguage?.name ?? course.from_language_name ?? "",
    learning_language: learningLanguage?.legacyId ?? 0,
    learning_language_name:
      learningLanguage?.name ?? course.learning_language_name ?? "",
    contributors: course.contributors ?? [],
    contributors_past: course.contributors_past ?? [],
    todo_count: course.todo_count ?? 0,
  };
}

async function getCourseByIdentifier(ctx: QueryCtx, identifier: string) {
  const isNumericIdentifier = /^\d+$/.test(identifier);
  if (isNumericIdentifier) {
    const numeric = Number(identifier);
    const byId = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) => q.eq("legacyId", numeric))
      .unique();
    if (byId) return byId;
  }

  return await ctx.db
    .query("courses")
    .withIndex("by_short", (q) => q.eq("short", identifier))
    .unique();
}

async function getUserNameByLegacyId(ctx: QueryCtx, legacyIds: number[]) {
  const uniqueLegacyIds = Array.from(new Set(legacyIds));
  if (!uniqueLegacyIds.length) return new Map<number, string>();

  const userIds = uniqueLegacyIds.map((legacyId) => String(legacyId));
  const users = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "user",
    where: [{ field: "userId", operator: "in", value: userIds }],
    paginationOpts: { cursor: null, numItems: userIds.length + 10 },
  })) as {
    page: Array<{ userId?: string | null; name?: string | null }>;
  };

  const map = new Map<number, string>();
  for (const user of users.page) {
    const legacyId = Number.parseInt(user.userId ?? "", 10);
    if (!Number.isFinite(legacyId) || !user.name) continue;
    map.set(legacyId, user.name);
  }

  return map;
}

async function getUserNameByAuthDocId(ctx: QueryCtx, authDocIds: string[]) {
  const uniqueAuthDocIds = Array.from(
    new Set(authDocIds.map((id) => id.trim()).filter(Boolean)),
  );
  if (!uniqueAuthDocIds.length) return new Map<string, string>();

  const map = new Map<string, string>();
  const byUserId = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "user",
    where: [{ field: "userId", operator: "in", value: uniqueAuthDocIds }],
    paginationOpts: { cursor: null, numItems: uniqueAuthDocIds.length + 10 },
  })) as {
    page: Array<{ userId?: string | null; name?: string | null }>;
  };

  for (const user of byUserId.page) {
    const userId = user.userId?.trim();
    if (!userId || !user.name) continue;
    map.set(userId, user.name);
  }

  const unresolvedIds = uniqueAuthDocIds.filter((id) => !map.has(id));
  if (!unresolvedIds.length) return map;

  // Fallback for legacy rows that still store Better Auth document IDs.
  const byDocId = await Promise.all(
    unresolvedIds.map(async (id) => {
      try {
        const user = (await ctx.runQuery(components.betterAuth.adapter.get, {
          id,
        })) as { name?: string | null } | null;
        return { id, name: user?.name ?? null };
      } catch {
        return { id, name: null };
      }
    }),
  );

  for (const result of byDocId) {
    if (!result.name) continue;
    map.set(result.id, result.name);
  }

  return map;
}

async function buildAvatarRows(
  ctx: QueryCtx,
  language: LanguageDoc,
  avatars?: AvatarDoc[],
  mappings?: AvatarMappingDoc[],
) {
  const avatarRows = avatars ?? (await ctx.db.query("avatars").collect());
  const mappingRows =
    mappings ??
    (await ctx.db
      .query("avatar_mappings")
      .withIndex("by_language_id", (q) => q.eq("languageId", language._id))
      .collect());

  const mappingByAvatar = new Map<Id<"avatars">, AvatarMappingDoc>();
  for (const mapping of mappingRows) {
    if (mapping.languageId !== language._id) continue;
    mappingByAvatar.set(mapping.avatarId, mapping);
  }

  return avatarRows
    .filter((avatar: AvatarDoc) => avatar.link !== "[object Object]")
    .map((avatar: AvatarDoc) => {
      const mapping = mappingByAvatar.get(avatar._id);
      return {
        id: mapping?.legacyId ?? null,
        avatar_id: avatar.legacyId,
        language_id: language.legacyId,
        name: mapping?.name ?? avatar.name ?? "",
        link: avatar.link,
        speaker: mapping?.speaker ?? "",
      };
    })
    .sort(
      (a: { avatar_id: number }, b: { avatar_id: number }) =>
        a.avatar_id - b.avatar_id,
    );
}

export const getEditorSidebarData = query({
  args: {},
  handler: async (ctx) => {
    const [languageRows, courseRows] = await Promise.all([
      ctx.db.query("languages").collect(),
      ctx.db.query("courses").collect(),
    ]);

    const languageById = new Map<Id<"languages">, LanguageDoc>();
    for (const language of languageRows)
      languageById.set(language._id, language);

    const languages = languageRows
      .map((language) => ({
        id: language.legacyId,
        short: language.short,
        flag:
          typeof language.flag === "number"
            ? language.flag
            : Number.isFinite(Number(language.flag))
              ? Number(language.flag)
              : null,
        flag_file: language.flag_file ?? null,
      }))
      .sort((a, b) => a.id - b.id);

    const courses = courseRows
      .map((course) => toCourse(course, languageById))
      .sort((a, b) => b.count - a.count);

    return { courses, languages };
  },
});

export const getEditorCourseByIdentifier = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const course = await getCourseByIdentifier(ctx, args.identifier);
    if (!course) return null;

    const [learningLanguage, fromLanguage] = await Promise.all([
      ctx.db.get(course.learningLanguageId) as Promise<LanguageDoc | null>,
      ctx.db.get(course.fromLanguageId) as Promise<LanguageDoc | null>,
    ]);

    return {
      id: course.legacyId,
      short: course.short ?? null,
      about: course.about ?? null,
      official: course.official,
      count: course.count ?? 0,
      public: course.public,
      from_language: fromLanguage?.legacyId ?? 0,
      from_language_name: fromLanguage?.name ?? course.from_language_name ?? "",
      learning_language: learningLanguage?.legacyId ?? 0,
      learning_language_name:
        learningLanguage?.name ?? course.learning_language_name ?? "",
      contributors: course.contributors ?? [],
      contributors_past: course.contributors_past ?? [],
      todo_count: course.todo_count ?? 0,
    };
  },
});

export const getEditorStoriesByCourseLegacyId = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const timerBase = `editorRead:getEditorStoriesByCourseLegacyId:course:${args.identifier}`;
    const storiesTimer = `${timerBase}:stories`;
    const imagesTimer = `${timerBase}:images`;
    const authorsTimer = `${timerBase}:authors`;
    console.time(timerBase);

    const course = await getCourseByIdentifier(ctx, args.identifier);
    if (!course) {
      console.timeEnd(timerBase);
      console.log(
        `[editorRead:getEditorStoriesByCourseLegacyId] course=${args.identifier} not_found`,
      );
      return [];
    }

    console.time(storiesTimer);
    const storyRows = await ctx.db
      .query("stories")
      .withIndex("by_set", (q) => q.eq("courseId", course._id))
      .collect();
    console.timeEnd(storiesTimer);

    const stories = storyRows.filter((story) => !story.deleted);

    console.time(imagesTimer);
    const imageIds = Array.from(
      new Set(
        stories
          .map((story) => story.imageId)
          .filter((id): id is Id<"images"> => Boolean(id)),
      ),
    );
    const images = await Promise.all(imageIds.map((id) => ctx.db.get(id)));
    const imageById = new Map<Id<"images">, Doc<"images">>();
    images.forEach((image) => {
      if (!image) return;
      imageById.set(image._id, image);
    });
    console.timeEnd(imagesTimer);

    console.time(authorsTimer);
    const authorLegacyIds = Array.from(
      new Set(
        stories
          .flatMap((story) => [
            toNumber(story.authorId),
            toNumber(story.authorChangeId),
          ])
          .filter((id): id is number => id !== undefined),
      ),
    );
    const authorAuthDocIds = Array.from(
      new Set(
        stories
          .flatMap((story) => [story.authorId, story.authorChangeId])
          .filter(
            (id): id is string =>
              typeof id === "string" &&
              id.trim().length > 0 &&
              toNumber(id) === undefined,
          ),
      ),
    );

    const [nameByLegacyId, nameByAuthDocId] = await Promise.all([
      getUserNameByLegacyId(ctx, authorLegacyIds),
      getUserNameByAuthDocId(ctx, authorAuthDocIds),
    ]);
    console.timeEnd(authorsTimer);

    const result = stories.map((story: StoryDoc) => {
      const authorId = toNumber(story.authorId);
      const authorChangeId = toNumber(story.authorChangeId);
      const rawAuthorId =
        typeof story.authorId === "string"
          ? story.authorId.trim()
          : story.authorId;
      const rawAuthorChangeId =
        typeof story.authorChangeId === "string"
          ? story.authorChangeId.trim()
          : story.authorChangeId;
      const image = story.imageId ? imageById.get(story.imageId) : undefined;
      const approvalCount = story.approvalCount;
      const derivedStatus =
        approvalCount === undefined
          ? story.status
          : approvalCount === 0
            ? "draft"
            : approvalCount === 1
              ? "feedback"
              : "finished";
      return {
        id: story.legacyId ?? 0,
        name: story.name,
        course_id: course.legacyId,
        image: image?.legacyId ?? "",
        set_id: story.set_id ?? 0,
        set_index: story.set_index ?? 0,
        date: story.date ?? 0,
        change_date: story.change_date ?? 0,
        status: derivedStatus,
        public: story.public,
        todo_count: story.todo_count ?? 0,
        approvalCount: approvalCount ?? 0,
        author:
          typeof authorId === "number"
            ? (nameByLegacyId.get(authorId) ?? `User ${authorId}`)
            : typeof rawAuthorId === "string" && rawAuthorId.length > 0
              ? (nameByAuthDocId.get(rawAuthorId) ?? `User ${rawAuthorId}`)
              : "Unknown",
        author_change:
          typeof authorChangeId === "number"
            ? (nameByLegacyId.get(authorChangeId) ?? `User ${authorChangeId}`)
            : typeof rawAuthorChangeId === "string" &&
                rawAuthorChangeId.length > 0
              ? (nameByAuthDocId.get(rawAuthorChangeId) ??
                `User ${rawAuthorChangeId}`)
              : null,
      };
    });

    console.timeEnd(timerBase);
    console.log(
      `[editorRead:getEditorStoriesByCourseLegacyId] course=${args.identifier} totalStories=${storyRows.length} visibleStories=${stories.length} uniqueImages=${imageIds.length} uniqueLegacyAuthors=${authorLegacyIds.length} uniqueAuthDocAuthors=${authorAuthDocIds.length}`,
    );

    return result;
  },
});

export const getEditorCourseImport = query({
  args: {
    courseLegacyId: v.number(),
    fromLegacyId: v.number(),
  },
  handler: async (ctx, args) => {
    const [toCourse, fromCourse] = await Promise.all([
      ctx.db
        .query("courses")
        .withIndex("by_id_value", (q) => q.eq("legacyId", args.courseLegacyId))
        .unique(),
      ctx.db
        .query("courses")
        .withIndex("by_id_value", (q) => q.eq("legacyId", args.fromLegacyId))
        .unique(),
    ]);
    if (!toCourse || !fromCourse) return [];

    const [sourceStories, targetStories] = await Promise.all([
      ctx.db
        .query("stories")
        .withIndex("by_course", (q) => q.eq("courseId", fromCourse._id))
        .collect(),
      ctx.db
        .query("stories")
        .withIndex("by_course", (q) => q.eq("courseId", toCourse._id))
        .collect(),
    ]);

    const activeSourceStories = sourceStories
      .filter((story) => !story.deleted)
      .sort((a, b) => {
        const setA = a.set_id ?? 0;
        const setB = b.set_id ?? 0;
        if (setA !== setB) return setA - setB;
        return (a.set_index ?? 0) - (b.set_index ?? 0);
      });

    const targetCountByDuoId = new Map<string, number>();
    for (const story of targetStories) {
      if (!story.duo_id) continue;
      targetCountByDuoId.set(
        story.duo_id,
        (targetCountByDuoId.get(story.duo_id) ?? 0) + 1,
      );
    }

    const imageIds = Array.from(
      new Set(
        activeSourceStories
          .map((story) => story.imageId)
          .filter((id): id is Id<"images"> => Boolean(id)),
      ),
    );
    const images = await Promise.all(imageIds.map((id) => ctx.db.get(id)));
    const imageById = new Map<Id<"images">, Doc<"images">>();
    for (const image of images) {
      if (!image) continue;
      imageById.set(image._id, image);
    }

    return activeSourceStories.map((story) => {
      const image = story.imageId ? imageById.get(story.imageId) : undefined;
      return {
        id: story.legacyId ?? 0,
        set_id: story.set_id ?? 0,
        set_index: story.set_index ?? 0,
        name: story.name,
        image_done: image?.gilded ?? "",
        image: image?.active ?? "",
        copies: String(targetCountByDuoId.get(story.duo_id ?? "") ?? 0),
      };
    });
  },
});

export const resolveEditorLanguage = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const numeric = toNumber(args.identifier);

    if (numeric !== undefined) {
      const language = await ctx.db
        .query("languages")
        .withIndex("by_id_value", (q) => q.eq("legacyId", numeric))
        .unique();
      if (!language) return null;
      return {
        language: toLanguage(language),
        course: null,
        language2: null,
      };
    }

    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.identifier))
      .unique();

    if (course) {
      const [language, language2] = await Promise.all([
        ctx.db.get(course.learningLanguageId),
        ctx.db.get(course.fromLanguageId),
      ]);
      if (!language) return null;
      return {
        language: toLanguage(language),
        course: {
          learning_language: language.legacyId,
          from_language: language2?.legacyId ?? 0,
          short: course.short ?? "",
        },
        language2: language2 ? toLanguage(language2) : null,
      };
    }

    const language = await ctx.db
      .query("languages")
      .withIndex("by_short", (q) => q.eq("short", args.identifier))
      .unique();
    if (!language) return null;

    return {
      language: toLanguage(language),
      course: null,
      language2: null,
    };
  },
});

export const getEditorSpeakersByLanguageLegacyId = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.languageLegacyId))
      .unique();
    if (!language) return [];

    const speakers = await ctx.db
      .query("speakers")
      .withIndex("by_language_id", (q) => q.eq("languageId", language._id))
      .collect();

    return speakers
      .map((speaker) => ({
        id: speaker.legacyId ?? 0,
        language_id: language.legacyId,
        speaker: speaker.speaker,
        gender: speaker.gender,
        type: speaker.type,
        service: speaker.service,
      }))
      .sort((a, b) => a.speaker.localeCompare(b.speaker));
  },
});

export const getEditorAvatarNamesByLanguageLegacyId = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.languageLegacyId))
      .unique();
    if (!language) return [];

    return await buildAvatarRows(ctx, language);
  },
});

export const getEditorLocalizationRowsByLanguageLegacyId = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    const [englishLanguage, targetLanguage] = await Promise.all([
      ctx.db
        .query("languages")
        .withIndex("by_short", (q) => q.eq("short", "en"))
        .unique(),
      ctx.db
        .query("languages")
        .withIndex("by_id_value", (q) =>
          q.eq("legacyId", args.languageLegacyId),
        )
        .unique(),
    ]);

    if (!englishLanguage || !targetLanguage) return [];

    const englishRows = await ctx.db
      .query("localizations")
      .withIndex("by_language_id_and_tag", (q) =>
        q.eq("languageId", englishLanguage._id),
      )
      .collect();

    const targetRows =
      englishLanguage._id === targetLanguage._id
        ? englishRows
        : await ctx.db
            .query("localizations")
            .withIndex("by_language_id_and_tag", (q) =>
              q.eq("languageId", targetLanguage._id),
            )
            .collect();

    const targetByTag = new Map<string, string>();
    for (const row of targetRows) {
      if (!row.tag) continue;
      targetByTag.set(row.tag, row.text);
    }

    return englishRows
      .filter((row) => Boolean(row.tag))
      .map((row) => ({
        tag: row.tag,
        text_en: row.text,
        text: targetByTag.get(row.tag) ?? null,
      }));
  },
});

export const getEditorStoryPageData = query({
  args: { storyId: v.number() },
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyId))
      .unique();
    if (!story || story.deleted) return null;

    const [course, storyContent] = await Promise.all([
      ctx.db.get(story.courseId),
      ctx.db
        .query("story_content")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .unique(),
    ]);
    if (!course || !storyContent) return null;

    const [learningLanguage, fromLanguage, image] = await Promise.all([
      ctx.db.get(course.learningLanguageId),
      ctx.db.get(course.fromLanguageId),
      story.imageId ? ctx.db.get(story.imageId) : Promise.resolve(null),
    ]);
    if (!learningLanguage || !fromLanguage) return null;

    return {
      story_data: {
        id: story.legacyId ?? 0,
        official: course.official,
        course_id: course.legacyId,
        duo_id: story.duo_id ?? "",
        image: image?.legacyId ?? "",
        name: story.name,
        set_id: story.set_id ?? 0,
        set_index: story.set_index ?? 0,
        text: storyContent.text,
        short: course.short ?? "",
        learning_language: learningLanguage.legacyId,
        from_language: fromLanguage.legacyId,
      },
    };
  },
});

export const getEditorImageByLegacyId = query({
  args: { legacyImageId: v.string() },
  handler: async (ctx, args) => {
    const image = await ctx.db
      .query("images")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyImageId))
      .unique();
    if (!image) return null;

    return {
      id: image.legacyId,
      active: image.active,
      gilded: image.gilded,
      locked: image.locked,
      active_lip: image.active_lip,
      gilded_lip: image.gilded_lip,
    };
  },
});

export const getEditorLanguageByLegacyId = query({
  args: { legacyLanguageId: v.number() },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyLanguageId))
      .unique();
    if (!language) return null;

    return toLanguage(language);
  },
});
