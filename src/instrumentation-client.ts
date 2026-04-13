import posthog from "posthog-js";

const posthogKey = process.env.VITE_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.VITE_POSTHOG_HOST,
    defaults: "2025-11-30",
  });
}
