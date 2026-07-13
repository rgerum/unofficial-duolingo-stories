import { afterEach, describe, expect, test, vi } from "vitest";
import {
  FeedbackServerUnavailableError,
  FeedbackSubmissionTimeoutError,
  submitFeedbackWithTimeout,
  waitForFeedbackConnection,
} from "./feedbackSubmission";

function disconnectedClient() {
  let connected = false;
  const listeners = new Set<
    (state: { isWebSocketConnected: boolean }) => void
  >();
  return {
    connectionState: () => ({ isWebSocketConnected: connected }),
    subscribeToConnectionState: (
      listener: (state: { isWebSocketConnected: boolean }) => void,
    ) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    connect: () => {
      connected = true;
      for (const listener of listeners)
        listener({ isWebSocketConnected: true });
    },
    listenerCount: () => listeners.size,
  };
}

describe("submitFeedbackWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("asks the caller to retry when the server does not respond in time", async () => {
    vi.useFakeTimers();
    const pendingSubmission = new Promise<never>(() => {});

    const result = submitFeedbackWithTimeout(pendingSubmission, 15_000);
    const rejection = expect(result).rejects.toBeInstanceOf(
      FeedbackSubmissionTimeoutError,
    );

    await vi.advanceTimersByTimeAsync(15_000);
    await rejection;
  });

  test("returns a response received before the timeout", async () => {
    vi.useFakeTimers();

    await expect(
      submitFeedbackWithTimeout(
        Promise.resolve({ reportId: "report-1" }),
        15_000,
      ),
    ).resolves.toEqual({ reportId: "report-1" });
  });
});

describe("waitForFeedbackConnection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("continues when Convex reconnects within the wait", async () => {
    vi.useFakeTimers();
    const client = disconnectedClient();
    const waiting = waitForFeedbackConnection(client, 15_000);

    client.connect();

    await expect(waiting).resolves.toBeUndefined();
    expect(client.listenerCount()).toBe(0);
  });

  test("stops waiting when Convex cannot reconnect", async () => {
    vi.useFakeTimers();
    const client = disconnectedClient();
    const waiting = waitForFeedbackConnection(client, 15_000);
    const rejection = expect(waiting).rejects.toBeInstanceOf(
      FeedbackServerUnavailableError,
    );

    await vi.advanceTimersByTimeAsync(15_000);
    await rejection;
    expect(client.listenerCount()).toBe(0);
  });
});
