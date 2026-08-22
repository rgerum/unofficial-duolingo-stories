import assert from "node:assert/strict";
import test from "node:test";
import { copyToClipboard } from "./copy_to_clipboard";

test("copies through a textarea when the Clipboard API is unavailable", async () => {
  let copied = false;
  let removed = false;
  const textarea = {
    value: "",
    style: {},
    focus() {},
    select() {},
    setSelectionRange() {},
    remove() {
      removed = true;
    },
  };

  await copyToClipboard("el-GR-AthinaNeural", {
    document: {
      body: {
        appendChild(node: Node) {
          assert.equal(node, textarea);
          return node;
        },
      } as unknown as HTMLElement,
      createElement() {
        return textarea as unknown as HTMLTextAreaElement;
      },
      execCommand(command) {
        assert.equal(command, "copy");
        copied = true;
        return true;
      },
    },
  });

  assert.equal(textarea.value, "el-GR-AthinaNeural");
  assert.equal(copied, true);
  assert.equal(removed, true);
});

test("removes the fallback textarea when the browser rejects copying", async () => {
  let removed = false;
  const textarea = {
    value: "",
    style: {},
    focus() {},
    select() {},
    setSelectionRange() {},
    remove() {
      removed = true;
    },
  };

  await assert.rejects(
    copyToClipboard("el-GR-AthinaNeural", {
      document: {
        body: {
          appendChild(node: Node) {
            assert.equal(node, textarea);
            return node;
          },
        } as unknown as HTMLElement,
        createElement() {
          return textarea as unknown as HTMLTextAreaElement;
        },
        execCommand(command) {
          assert.equal(command, "copy");
          return false;
        },
      },
    }),
    /browser rejected the copy command/,
  );
  assert.equal(removed, true);
});
