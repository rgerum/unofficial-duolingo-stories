import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/client";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React from "react";

WebBrowser.maybeCompleteAuthSession();

const convexSiteUrl =
  process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??
  "https://compassionate-chinchilla-392.convex.site";

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [
    expoClient({
      scheme: "duostories",
      storagePrefix: "duostories",
      storage: SecureStore,
    }),
    convexClient(),
    usernameClient(),
  ],
});

export type AuthSession = {
  session?: {
    id?: string | null;
  } | null;
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    username?: string | null;
  } | null;
} | null;

const sessionListeners = new Set<() => void>();

export function notifyAuthChanged() {
  for (const listener of sessionListeners) listener();
}

export async function prepareAuthBrowser(): Promise<void> {
  try {
    await WebBrowser.warmUpAsync();
  } catch {
    // Best effort. iOS auth sessions do not need warmup, but the static import
    // keeps Metro from loading expo-web-browser only after OAuth starts.
  }
}

async function getCurrentSession(): Promise<AuthSession> {
  const result = await authClient.getSession();
  return "data" in result ? (result.data as AuthSession) : null;
}

export function useAuthSession(): {
  data: AuthSession;
  isPending: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<AuthSession>(null);
  const [isPending, setIsPending] = React.useState(true);

  const refetch = React.useCallback(async () => {
    setIsPending(true);
    try {
      setData(await getCurrentSession());
    } catch {
      setData(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  React.useEffect(() => {
    sessionListeners.add(refetch);
    void refetch();
    return () => {
      sessionListeners.delete(refetch);
    };
  }, [refetch]);

  return { data, isPending, refetch };
}

export function useConvexBetterAuth() {
  const { data: session, isPending } = useAuthSession();
  const sessionId = session?.session?.id;

  const fetchAccessToken = React.useCallback(async () => {
    if (!sessionId) return null;
    try {
      const { data } = await authClient.convex.token({
        fetchOptions: { throw: false },
      });
      return data?.token ?? null;
    } catch {
      return null;
    }
  }, [sessionId]);

  return React.useMemo(
    () => ({
      isLoading: isPending,
      isAuthenticated: Boolean(sessionId),
      fetchAccessToken,
    }),
    [fetchAccessToken, isPending, sessionId],
  );
}
