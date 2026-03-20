"use client";

import posthog from "posthog-js";

export type PostHogUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

let identifiedUserId: string | null = null;

export function identifyPostHogUser(user: PostHogUser | null | undefined) {
  if (!user?.id) return false;
  if (identifiedUserId === user.id) return true;

  posthog.identify(user.id, {
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    username: user.username ?? undefined,
  });
  identifiedUserId = user.id;
  return true;
}

export function resetPostHogUser() {
  identifiedUserId = null;
  posthog.reset();
}
