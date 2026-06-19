export const EDITOR_SAVE_AUTH_RETRY_DELAY_MS = 750;
export const EDITOR_SAVE_AUTH_RETRY_TIMEOUT_MS = 3000;
const EDITOR_SAVE_AUTH_RETRY_POLL_MS = 100;

type AuthRetryOptions = {
  isRefreshing?: () => boolean;
  delayMs?: number;
  timeoutMs?: number;
  pollMs?: number;
  wait?: (ms: number) => Promise<void>;
};

const defaultWait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function isAuthRelatedSaveError(error: unknown): boolean {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = rawMessage.toLowerCase();
  return (
    message.includes("unauthorized") ||
    message.includes("unauthenticated") ||
    message.includes("auth token") ||
    message.includes("jwt") ||
    message.includes("token expired")
  );
}

async function waitForAuthRefresh({
  isRefreshing,
  delayMs = EDITOR_SAVE_AUTH_RETRY_DELAY_MS,
  timeoutMs = EDITOR_SAVE_AUTH_RETRY_TIMEOUT_MS,
  pollMs = EDITOR_SAVE_AUTH_RETRY_POLL_MS,
  wait = defaultWait,
}: AuthRetryOptions) {
  await wait(delayMs);
  const start = Date.now();
  while (isRefreshing?.() && Date.now() - start < timeoutMs) {
    await wait(pollMs);
  }
}

export async function retryOnceAfterAuthRefresh<T>(
  operation: () => Promise<T>,
  options: AuthRetryOptions = {},
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isAuthRelatedSaveError(error)) {
      throw error;
    }
    await waitForAuthRefresh(options);
    return await operation();
  }
}
