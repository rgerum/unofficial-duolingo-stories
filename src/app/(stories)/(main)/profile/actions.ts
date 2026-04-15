"use server";

import { fetchAuthMutation } from "@/lib/auth-server";
import { cookies } from "next/headers";
import { HIDE_STORY_QUESTIONS_COOKIE } from "@/lib/story-preferences";
import { api } from "@convex/_generated/api";

const STORY_PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function setHideStoryQuestionsPreference(hideQuestions: boolean) {
  await fetchAuthMutation(api.userPreferences.setCurrentStoryPreferences, {
    hideStoryQuestions: hideQuestions,
  });

  const cookieStore = await cookies();

  cookieStore.set(HIDE_STORY_QUESTIONS_COOKIE, hideQuestions ? "1" : "0", {
    path: "/",
    maxAge: STORY_PREFERENCE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
