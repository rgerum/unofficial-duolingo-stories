"use client";

import React from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

export default function PostHogUserIdentifier() {
  const { data: session } = authClient.useSession();
  const user = (session?.user ?? null) as SessionUser | null;
  const identifiedUserId = React.useRef<string | null>(null);

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

  return null;
}
