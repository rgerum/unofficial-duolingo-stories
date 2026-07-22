import { describe, expect, it } from "vitest";
import { findNextStory, type WidgetStory } from "./nextStory";

const stories = [
  { id: 1, name: "One", set_id: 1, set_index: 0 },
  { id: 2, name: "Two", set_id: 1, set_index: 1 },
  { id: 3, name: "Three", set_id: 2, set_index: 0 },
].map(
  (story): WidgetStory => ({
    id: story.id,
    name: story.name,
    image: `image-${story.id}`,
  }),
);

describe("findNextStory", () => {
  it("returns the first unfinished story with course progress", () => {
    expect(findNextStory(stories, new Set([1]))).toMatchObject({
      id: 2,
      completedCount: 1,
      totalCount: 3,
    });
  });

  it("returns null when every story is finished", () => {
    expect(findNextStory(stories, new Set([1, 2, 3]))).toBeNull();
  });
});
