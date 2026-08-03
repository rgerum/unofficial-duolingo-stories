import { describe, expect, test } from "vitest";
import { formatPublicationAnnouncement } from "./lib/discordAnnouncements";

describe("formatPublicationAnnouncement", () => {
  test("formats a newly public course", () => {
    expect(
      formatPublicationAnnouncement({
        eventKey: "course:100:published:1",
        kind: "course_published",
        learningLanguage: "Spanish",
        fromLanguage: "English",
        courseShort: "es-en",
      }),
    ).toBe(
      "🎉 A new Spanish course for English speakers is now available on DuoStories!\nhttps://duostories.org/es-en",
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
      }),
    ).toBe(
      "📚 A new set of 4 Spanish stories for English speakers is now available on DuoStories!\nhttps://duostories.org/es-en",
    );
  });
});
