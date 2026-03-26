import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ---- Queries ----

/** Get all news stories for a specific date + language */
export const getByDate = query({
  args: { date: v.string(), language: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("news_stories")
      .withIndex("by_date_and_language", (q) =>
        q.eq("date", args.date).eq("language", args.language),
      )
      .collect();
  },
});

/** Get a specific news story by date + language + level */
export const getByDateAndLevel = query({
  args: { date: v.string(), language: v.string(), level: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("news_stories")
      .withIndex("by_date_and_language_and_level", (q) =>
        q
          .eq("date", args.date)
          .eq("language", args.language)
          .eq("level", args.level),
      )
      .collect();
  },
});

/** Get story content including audio URLs */
export const getContent = query({
  args: { newsStoryId: v.id("news_stories") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("news_story_content")
      .withIndex("by_news_story", (q) => q.eq("newsStoryId", args.newsStoryId))
      .unique();
    if (!content) return null;

    // Resolve storage IDs to URLs for audio files
    const audioUrls: Record<number, string> = {};
    if (content.audioFiles) {
      for (const entry of content.audioFiles) {
        const url = await ctx.storage.getUrl(entry.storageId);
        if (url) {
          audioUrls[entry.lineIndex] = url;
        }
      }
    }

    return {
      storyText: content.storyText,
      rawOutput: content.rawOutput,
      audioUrls,
    };
  },
});

/** Get list of all available dates (for archive) */
export const getAvailableDates = query({
  args: { language: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const stories = await ctx.db
      .query("news_stories")
      .withIndex("by_language", (q) => q.eq("language", args.language))
      .collect();

    const dates = new Set<string>();
    for (const story of stories) {
      dates.add(story.date);
    }
    return Array.from(dates).sort().reverse();
  },
});

// ---- Mutations (internal, called by the generation action) ----

export const createNewsStory = internalMutation({
  args: {
    date: v.string(),
    language: v.string(),
    fromLanguage: v.string(),
    level: v.string(),
    topic: v.optional(v.string()),
    topicKey: v.optional(v.string()),
    topicIndex: v.optional(v.number()),
    topicSummary: v.optional(v.string()),
    headlines: v.array(v.string()),
    model: v.optional(v.string()),
    storyText: v.string(),
    rawOutput: v.string(),
    // Grammar curriculum fields
    grammarFocus: v.optional(v.string()),
    grammarMode: v.optional(v.string()),
    grammarWeek: v.optional(v.number()),
    grammarCycleLength: v.optional(v.number()),
    secondaryGrammar: v.optional(v.string()),
    weekType: v.optional(v.string()),
  },
  returns: v.id("news_stories"),
  handler: async (ctx, args) => {
    const existing =
      args.topicKey === undefined
        ? null
        : await ctx.db
            .query("news_stories")
            .withIndex("by_date_and_language_and_topic_key_and_level", (q) =>
              q
                .eq("date", args.date)
                .eq("language", args.language)
                .eq("topicKey", args.topicKey)
                .eq("level", args.level),
            )
            .unique();

    if (existing) {
      // Delete old content and story
      const oldContent = await ctx.db
        .query("news_story_content")
        .withIndex("by_news_story", (q) => q.eq("newsStoryId", existing._id))
        .unique();
      if (oldContent) {
        if (oldContent.audioFiles) {
          for (const entry of oldContent.audioFiles) {
            await ctx.storage.delete(entry.storageId);
          }
        }
        await ctx.db.delete(oldContent._id);
      }
      await ctx.db.delete(existing._id);
    }

    const storyId = await ctx.db.insert("news_stories", {
      date: args.date,
      language: args.language,
      fromLanguage: args.fromLanguage,
      level: args.level,
      topic: args.topic,
      topicKey: args.topicKey,
      topicIndex: args.topicIndex,
      topicSummary: args.topicSummary,
      headlines: args.headlines,
      model: args.model,
      createdAt: Date.now(),
      grammarFocus: args.grammarFocus,
      grammarMode: args.grammarMode,
      grammarWeek: args.grammarWeek,
      grammarCycleLength: args.grammarCycleLength,
      secondaryGrammar: args.secondaryGrammar,
      weekType: args.weekType,
    });

    await ctx.db.insert("news_story_content", {
      newsStoryId: storyId,
      storyText: args.storyText,
      rawOutput: args.rawOutput,
    });

    return storyId;
  },
});

export const addAudioToStory = internalMutation({
  args: {
    newsStoryId: v.id("news_stories"),
    audioFiles: v.array(
      v.object({
        lineIndex: v.number(),
        storageId: v.id("_storage"),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("news_story_content")
      .withIndex("by_news_story", (q) => q.eq("newsStoryId", args.newsStoryId))
      .unique();
    if (!content) throw new Error("Story content not found");

    await ctx.db.patch(content._id, {
      audioFiles: args.audioFiles,
    });
    return null;
  },
});

export const logGenerationMetric = internalMutation({
  args: {
    scope: v.union(v.literal("story"), v.literal("batch")),
    date: v.string(),
    language: v.string(),
    fromLanguage: v.string(),
    level: v.optional(v.string()),
    topic: v.optional(v.string()),
    topicKey: v.optional(v.string()),
    topicIndex: v.optional(v.number()),
    newsStoryId: v.optional(v.id("news_stories")),
    storyCount: v.number(),
    model: v.optional(v.string()),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    estimatedCostUsd: v.number(),
    storyAttemptCount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("news_story_generation_metrics", {
      ...args,
      createdAt: Date.now(),
    });
    return null;
  },
});
