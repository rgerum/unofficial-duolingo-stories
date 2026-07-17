import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createOperationKey } from "./operation-key";

const originalCrypto = globalThis.crypto;

afterEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: originalCrypto,
  });
});

test("createOperationKey uses crypto.randomUUID when available", () => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      randomUUID: () => "known-operation-key",
    },
  });

  assert.equal(createOperationKey(), "known-operation-key");
});

test("createOperationKey falls back when crypto.randomUUID is unavailable", () => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.set([
          0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa,
          0xbb, 0xcc, 0xdd, 0xee, 0xff,
        ]);
        return bytes;
      },
    },
  });

  assert.equal(createOperationKey(), "00112233-4455-4677-8899-aabbccddeeff");
});
