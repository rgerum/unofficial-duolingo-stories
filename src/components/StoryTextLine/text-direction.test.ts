import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStoryLineDirection } from "./text-direction";

describe("getStoryLineDirection", () => {
  it("keeps English story lines LTR inside an RTL story", () => {
    assert.equal(
      getStoryLineDirection({ storyRtl: true, lineLang: "en" }),
      false,
    );
  });

  it("uses RTL for learning language lines inside an RTL story", () => {
    assert.equal(
      getStoryLineDirection({ storyRtl: true, lineLang: "dv" }),
      true,
    );
  });

  it("allows explicit RTL lines in an LTR story", () => {
    assert.equal(
      getStoryLineDirection({ storyRtl: false, lineLang: "rtl" }),
      true,
    );
  });
});
