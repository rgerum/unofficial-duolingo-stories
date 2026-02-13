import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;
const noopPostHogClient = {
  capture: () => undefined,
  shutdown: async () => undefined,
};

type PostHogLike = Pick<PostHog, "capture" | "shutdown">;

export function getPostHogClient(): PostHogLike {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    return noopPostHogClient;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
