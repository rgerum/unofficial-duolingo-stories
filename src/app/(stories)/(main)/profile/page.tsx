import Header from "../header";
import Profile from "./profile";
import getUserId from "@/lib/getUserId";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://duostories.org/profile",
  },
};

export interface ProfileData {
  providers: string[];
  name: string;
  email: string;
  role: string[];
  provider_linked: Record<string, boolean>;
}

async function getLinkedProviders(): Promise<ProfileData | undefined> {
  const user_id = await getUserId();
  if (!user_id) return undefined;

  const profile = await fetchQuery(api.users.getProfileByLegacyId, {
    legacyId: user_id,
  });

  if (!profile) return undefined;

  return profile;
}

export default async function Page() {
  const providers = await getLinkedProviders();

  if (providers === undefined) {
    return (
      <Header>
        <p data-cy="profile-error">Not Logged in</p>
        <p>You need to be logged in to see your profile.</p>
      </Header>
    );
  }

  return (
    <>
      <Profile providers={providers} />
    </>
  );
}
