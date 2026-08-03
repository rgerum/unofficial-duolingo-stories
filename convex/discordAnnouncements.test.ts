import { afterEach, describe, expect, test, vi } from "vitest";
import {
  deriveDiscordNonce,
  handlePublicationAnnouncement,
} from "./discordAnnouncements";
import { formatPublicationAnnouncement } from "./lib/discordAnnouncements";

const announcement = {
  eventKey: "course:100:set:2:published:1722729600000",
  kind: "set_published" as const,
  learningLanguage: "Spanish",
  fromLanguage: "English",
  courseShort: "es-en",
  storyCount: 4,
  totalStoryCount: 24,
};

function createContext() {
  return {
    scheduler: {
      runAfter: vi.fn(),
    },
  };
}

function configureDiscord() {
  vi.stubEnv("DISCORD_TOKEN", "test-token");
  vi.stubEnv("DISCORD_ANNOUNCEMENTS_CHANNEL_ID", "channel-123");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("formatPublicationAnnouncement", () => {
  test("formats a newly public course", () => {
    expect(
      formatPublicationAnnouncement({
        eventKey: "course:100:published:1",
        kind: "course_published",
        learningLanguage: "Spanish",
        fromLanguage: "English",
        courseShort: "es-en",
        totalStoryCount: 12,
      }),
    ).toBe(
      "🎉 A new Spanish course for English speakers is now available on DuoStories!\nThe course now has 12 published stories.\nhttps://duostories.org/es-en",
    );
  });

  test("formats a newly published story set", () => {
    expect(
      formatPublicationAnnouncement({
        eventKey: "course:100:set:2:published:1",
        kind: "set_published",
        learningLanguage: "Spanish",
        fromLanguage: "English",
        courseShort: "es-en",
        storyCount: 4,
        totalStoryCount: 24,
      }),
    ).toBe(
      "📚 A new set of 4 Spanish stories for English speakers is now available on DuoStories!\nThe course now has 24 published stories.\nhttps://duostories.org/es-en",
    );
  });
});

describe("postPublicationAnnouncement", () => {
  test("returns missing_config without calling Discord", async () => {
    vi.stubEnv("DISCORD_TOKEN", "");
    vi.stubEnv("DISCORD_BOT_TOKEN", "");
    vi.stubEnv("DISCORD_ANNOUNCEMENTS_CHANNEL_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = createContext();

    await expect(
      handlePublicationAnnouncement(ctx, {
        announcement,
        attempt: 1,
        operationKey: announcement.eventKey,
      }),
    ).resolves.toEqual({ posted: false, reason: "missing_config" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  test("posts the expected payload with a deterministic short nonce", async () => {
    configureDiscord();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const ctx = createContext();

    await expect(
      handlePublicationAnnouncement(ctx, {
        announcement,
        attempt: 1,
        operationKey: announcement.eventKey,
      }),
    ).resolves.toEqual({ posted: true });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://discord.com/api/v10/channels/channel-123/messages",
    );
    expect(init.headers).toEqual({
      authorization: "Bot test-token",
      "content-type": "application/json",
    });
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      content: formatPublicationAnnouncement(announcement),
      nonce: await deriveDiscordNonce(announcement.eventKey),
      enforce_nonce: true,
    });
    expect(body.nonce).toHaveLength(24);
    expect(await deriveDiscordNonce(announcement.eventKey)).toBe(body.nonce);
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  test("retries transient failures with an incremented attempt", async () => {
    configureDiscord();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = createContext();

    await expect(
      handlePublicationAnnouncement(ctx, {
        announcement,
        attempt: 2,
        operationKey: announcement.eventKey,
      }),
    ).resolves.toEqual({ posted: false, reason: "request_failed" });
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
      120_000,
      expect.anything(),
      {
        announcement,
        attempt: 3,
        operationKey: announcement.eventKey,
      },
    );
  });

  test("uses Retry-After for rate limits", async () => {
    configureDiscord();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "2.5" },
        }),
      ),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = createContext();

    await handlePublicationAnnouncement(ctx, {
      announcement,
      attempt: 1,
      operationKey: announcement.eventKey,
    });
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
      2_500,
      expect.anything(),
      expect.objectContaining({
        attempt: 2,
        operationKey: announcement.eventKey,
      }),
    );
  });

  test("does not retry permanent client errors", async () => {
    configureDiscord();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 })),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = createContext();

    await expect(
      handlePublicationAnnouncement(ctx, {
        announcement,
        attempt: 1,
        operationKey: announcement.eventKey,
      }),
    ).resolves.toEqual({ posted: false, reason: "request_failed" });
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  test("does not retry after MAX_ATTEMPTS", async () => {
    configureDiscord();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = createContext();

    await expect(
      handlePublicationAnnouncement(ctx, {
        announcement,
        attempt: 5,
        operationKey: announcement.eventKey,
      }),
    ).resolves.toEqual({ posted: false, reason: "request_failed" });
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });
});
