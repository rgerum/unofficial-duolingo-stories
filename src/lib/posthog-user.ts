"use client";

import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

export type PostHogUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  role?: string | null;
};

export function identifyPostHogUser(user: PostHogUser | null | undefined) {
  if (!user?.id) return false;

  const role = typeof user.role === "string" ? user.role : null;
  const isAdmin = role === "admin";
  const isContributor = role === "contributor" || isAdmin;
  posthog.identify(user.id, {
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    username: user.username ?? undefined,
    role: role ?? undefined,
    is_admin: isAdmin,
    is_contributor: isContributor,
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
