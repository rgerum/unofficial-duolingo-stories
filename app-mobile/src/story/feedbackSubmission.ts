export const FEEDBACK_SUBMISSION_TIMEOUT_MS = 15_000;

type FeedbackConnectionClient = {
  connectionState: () => { isWebSocketConnected: boolean };
  subscribeToConnectionState: (
    callback: (state: { isWebSocketConnected: boolean }) => void,
  ) => () => void;
};

export class FeedbackServerUnavailableError extends Error {
  constructor(message = "Feedback server is unavailable") {
    super(message);
    this.name = "FeedbackServerUnavailableError";
  }
}

export class FeedbackSubmissionTimeoutError extends FeedbackServerUnavailableError {
  constructor() {
    super("Feedback submission timed out");
    this.name = "FeedbackSubmissionTimeoutError";
  }
}

export async function waitForFeedbackConnection(
  client: FeedbackConnectionClient,
  timeoutMs = FEEDBACK_SUBMISSION_TIMEOUT_MS,
): Promise<void> {
  if (client.connectionState().isWebSocketConnected) return;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe = () => {};
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      if (timeout !== undefined) clearTimeout(timeout);
      unsubscribe();
      callback();
    };
    const stopSubscription = client.subscribeToConnectionState((state) => {
      if (state.isWebSocketConnected) finish(resolve);
    });
    unsubscribe = stopSubscription;
    if (settled) {
      stopSubscription();
      return;
    }
    timeout = setTimeout(() => {
      finish(() => reject(new FeedbackServerUnavailableError()));
    }, timeoutMs);

    // Cover a connection established between the initial check and subscription.
    if (client.connectionState().isWebSocketConnected) finish(resolve);
  });
}

export async function submitFeedbackWithTimeout<T>(
  submission: Promise<T>,
  timeoutMs = FEEDBACK_SUBMISSION_TIMEOUT_MS,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new FeedbackSubmissionTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([submission, timedOut]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
