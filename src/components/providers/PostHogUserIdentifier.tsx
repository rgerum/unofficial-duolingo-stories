"use client";

import React from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

const PENDING_SIGNIN_STORAGE_KEY = "posthog_pending_signin";

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

type PendingSignInPayload = {
  method?: string;
  provider?: string;
};

export default function PostHogUserIdentifier() {
  const { data: session } = authClient.useSession();
  const user = (session?.user ?? null) as SessionUser | null;
  const identifiedUserId = React.useRef<string | null>(null);
  const trackedSignInUserId = React.useRef<string | null>(null);

  const readPendingSignIn = React.useCallback((): PendingSignInPayload | null => {
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
    if (identifiedUserId.current === user.id) return;

    posthog.identify(user.id, {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
    });
    identifiedUserId.current = user.id;
  }, [user?.id, user?.email, user?.name, user?.username]);

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
