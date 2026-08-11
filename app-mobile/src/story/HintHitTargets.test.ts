import { describe, expect, test } from "vitest";
import { findHintAtPoint, type HintFragment } from "./HintHitTargets";

describe("findHintAtPoint", () => {
  test("makes a narrow hinted word reachable near its rendered glyphs", () => {
    const fragments: HintFragment[] = [
      { tokenKey: "2:a", x1: 20, x2: 29, y: 10, height: 22 },
    ];

    expect(findHintAtPoint(fragments, 35, 21)?.tokenKey).toBe("2:a");
  });

  test("does not activate a distant hinted word", () => {
    const fragments: HintFragment[] = [
      { tokenKey: "2:a", x1: 20, x2: 29, y: 10, height: 22 },
    ];

    expect(findHintAtPoint(fragments, 70, 21)).toBeUndefined();
  });

  test("chooses the closest word when expanded targets overlap", () => {
    const fragments: HintFragment[] = [
      { tokenKey: "0:I", x1: 10, x2: 18, y: 10, height: 22 },
      { tokenKey: "2:a", x1: 27, x2: 36, y: 10, height: 22 },
    ];

    expect(findHintAtPoint(fragments, 24, 21)?.tokenKey).toBe("2:a");
  });
});
