"use client";

import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

export type PostHogUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

export function identifyPostHogUser(user: PostHogUser | null | undefined) {
  if (!user?.id) return false;

  posthog.identify(user.id, {
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    username: user.username ?? undefined,
  });
  return true;
}

export async function getCurrentPostHogUser() {
  try {
    const { data } = await authClient.getSession();
    const user = (data?.user ?? null) as PostHogUser | null;
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

export function resetPostHogUser() {
  posthog.reset();
}
