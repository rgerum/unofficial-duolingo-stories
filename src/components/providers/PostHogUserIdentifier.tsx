"use client";

import React from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";
import { identifyPostHogUser } from "@/lib/posthog-user";

const PENDING_SIGNIN_STORAGE_KEY = "posthog_pending_signin";

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  role?: string | null;
};

type PendingSignInPayload = {
  method?: string;
  provider?: string;
};

export default function PostHogUserIdentifier() {
  const { data: session } = authClient.useSession();
  const user = (session?.user ?? null) as SessionUser | null;
  const trackedSignInUserId = React.useRef<string | null>(null);

  const readPendingSignIn =
    React.useCallback((): PendingSignInPayload | null => {
      if (typeof window === "undefined") return null;
      const value = window.sessionStorage.getItem(PENDING_SIGNIN_STORAGE_KEY);
      if (!value) return null;
      try {
        return JSON.parse(value) as PendingSignInPayload;
      } catch {
        window.sessionStorage.removeItem(PENDING_SIGNIN_STORAGE_KEY);
        return null;
      }
    }, []);

  React.useEffect(() => {
    if (!user?.id) return;
    identifyPostHogUser(user);
  }, [user]);

  React.useEffect(() => {
    if (!user?.id) return;
    if (trackedSignInUserId.current === user.id) return;

    const pending = readPendingSignIn();
    if (!pending) return;

    posthog.capture("user_signed_in", {
      method: pending.method ?? "unknown",
      provider: pending.provider ?? undefined,
    });
    trackedSignInUserId.current = user.id;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PENDING_SIGNIN_STORAGE_KEY);
    }
  }, [readPendingSignIn, user?.id]);

  return null;
}
