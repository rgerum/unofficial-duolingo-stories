import { cookies } from "next/headers";
import { fetchAuthQuery } from "@/lib/auth-server";
import {
  HIDE_STORY_QUESTIONS_COOKIE,
  isStoryQuestionsDisabled,
} from "@/lib/story-preferences";
import { getUser, isAdmin, isContributor } from "@/lib/userInterface";
import { api } from "@convex/_generated/api";

export interface ProfileData {
  name: string;
  username: string;
  email: string;
  image: string | null;
  role: string[];
  provider_linked: Record<string, boolean>;
  hide_story_questions: boolean;
}

export async function getProfileData() {
  const providersBase = ["facebook", "github", "google", "discord"];
  const user = await getUser();
  if (!user) return undefined;
  if (!user.email) throw new Error("No user email available");
  const cookieStore = await cookies();

  const [providersFromAuth, storyPreferences] = await Promise.all([
    fetchAuthQuery(api.auth.getLinkedProvidersForCurrentUser, {}) as Promise<
      string[]
    >,
    fetchAuthQuery(
      api.userPreferences.getCurrentStoryPreferences,
      {},
    ) as Promise<{
      hasSavedPreference: boolean;
      hideStoryQuestions: boolean;
    }>,
  ]);

  const providerLinked = Object.fromEntries(
    providersBase.map((provider) => [provider, false]),
  ) as Record<string, boolean>;

  for (const provider of providersFromAuth) {
    if (provider in providerLinked) {
      providerLinked[provider] = true;
    }
  }

  const role = [];
  if (isAdmin(user)) role.push("Admin");
  if (isContributor(user)) role.push("Contributor");
  const displayName =
    user.name ?? user.username ?? user.email.split("@")[0] ?? "User";
  const username = user.username ?? displayName;

  return {
    name: displayName,
    username,
    email: user.email,
    image: user.image ?? null,
    role,
    provider_linked: providerLinked,
    hide_story_questions: storyPreferences.hasSavedPreference
      ? storyPreferences.hideStoryQuestions
      : isStoryQuestionsDisabled(
          cookieStore.get(HIDE_STORY_QUESTIONS_COOKIE)?.value,
        ),
  } satisfies ProfileData;
}
