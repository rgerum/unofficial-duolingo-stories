import PostHog from "posthog-react-native";
import { getString, setString, STORAGE_KEYS } from "./storage";

type AnalyticsEventProperties = NonNullable<Parameters<PostHog["capture"]>[1]>;

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let clientPromise: Promise<PostHog | null> | null = null;

function createInstallationId(): string {
  return `mobile_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}${Math.random().toString(36).slice(2)}`;
}

async function getInstallationId(): Promise<string> {
  const existing = await getString(STORAGE_KEYS.analyticsInstallationId);
  if (existing) return existing;
  const installationId = createInstallationId();
  await setString(STORAGE_KEYS.analyticsInstallationId, installationId);
  return installationId;
}

async function getClient(): Promise<PostHog | null> {
  if (!posthogKey) return null;
  if (!clientPromise) {
    clientPromise = getInstallationId().then(
      (distinctId) =>
        new PostHog(posthogKey, {
          host: posthogHost,
          bootstrap: { distinctId },
          captureAppLifecycleEvents: false,
          disableRemoteConfig: true,
          disableRemoteFeatureFlags: true,
          disableSurveys: true,
          enableSessionReplay: false,
          personProfiles: "never",
          setDefaultPersonProperties: false,
        }),
    );
  }
  return clientPromise;
}

export async function captureMobileEvent(
  eventName: string,
  properties: AnalyticsEventProperties = {},
): Promise<void> {
  try {
    const client = await getClient();
    if (!client) return;
    client.capture(eventName, {
      platform: "mobile",
      ...properties,
    });
  } catch {
    // Analytics must never block app behavior.
  }
}

export function captureMobileEventLater(
  eventName: string,
  properties: AnalyticsEventProperties = {},
): void {
  void captureMobileEvent(eventName, properties);
}
