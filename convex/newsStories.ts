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
      .unique();
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
    // Fetch all stories for this language and extract unique dates
    const allStories = await ctx.db.query("news_stories").collect();

    const dates = new Set<string>();
    for (const story of allStories) {
      if (story.language === args.language) {
        dates.add(story.date);
      }
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
    headlines: v.array(v.string()),
    model: v.optional(v.string()),
    storyText: v.string(),
    rawOutput: v.string(),
  },
  returns: v.id("news_stories"),
  handler: async (ctx, args) => {
    // Check if story already exists for this date/language/level
    const existing = await ctx.db
      .query("news_stories")
      .withIndex("by_date_and_language_and_level", (q) =>
        q
          .eq("date", args.date)
          .eq("language", args.language)
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
      headlines: args.headlines,
      model: args.model,
      createdAt: Date.now(),
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
