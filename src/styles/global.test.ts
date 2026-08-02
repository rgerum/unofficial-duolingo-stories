import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("dark utilities follow the app theme attribute", () => {
  const globalCss = readFileSync(
    new URL("./global.css", import.meta.url),
    "utf8",
  );

  assert.match(
    globalCss,
    /@custom-variant dark \(&:is\(\[data-theme="dark"\], \[data-theme="dark"\] \*\)\);/,
  );
});
