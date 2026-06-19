import assert from "node:assert/strict";
import test from "node:test";
import {
  isAuthRelatedSaveError,
  retryOnceAfterAuthRefresh,
} from "./save_auth_retry";

test("auth-related save failures are retried once", async () => {
  let attempts = 0;
  let waits = 0;

  const result = await retryOnceAfterAuthRefresh(
    async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("Unauthorized");
      }
      return "saved";
    },
    {
      wait: async () => {
        waits += 1;
      },
    },
  );

  assert.equal(result, "saved");
  assert.equal(attempts, 2);
  assert.equal(waits, 1);
});

test("non-auth save failures are not retried", async () => {
  let attempts = 0;

  await assert.rejects(
    retryOnceAfterAuthRefresh(
      async () => {
        attempts += 1;
        throw new Error("Story 123 not found");
      },
      {
        wait: async () => {},
      },
    ),
    /Story 123 not found/,
  );

  assert.equal(attempts, 1);
});

test("retry waits for an in-progress auth refresh", async () => {
  let attempts = 0;
  let waits = 0;
  let refreshing = true;

  const result = await retryOnceAfterAuthRefresh(
    async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("Unauthenticated");
      }
      return "saved";
    },
    {
      isRefreshing: () => refreshing,
      wait: async () => {
        waits += 1;
        if (waits === 2) {
          refreshing = false;
        }
      },
    },
  );

  assert.equal(result, "saved");
  assert.equal(attempts, 2);
  assert.equal(waits, 2);
});

test("auth error detection covers token expiry wording", () => {
  assert.equal(isAuthRelatedSaveError(new Error("auth token expired")), true);
  assert.equal(isAuthRelatedSaveError(new Error("JWT expired")), true);
  assert.equal(isAuthRelatedSaveError(new Error("Validation failed")), false);
});
