import { sql } from "@/lib/db";
import Header from "../header";
import Profile from "./profile";
import getUserId from "@/lib/getUserId";
import { getUser, isAdmin, isContributor } from "@/lib/userInterface";
import { Metadata } from "next";

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

async function getLinkedProviders() {
  let providers_base = ["facebook", "github", "google", "discord"];
  const user = await getUser();
  if (!user) return undefined;
  let user_id = await getUserId();
  if (!user_id) throw new Error("No user id provided");

  const req2 =
    await sql`SELECT provider FROM accounts WHERE "userId" = ${user_id}`;

  let provider_linked: Record<string, boolean> = {};
  for (let p of providers_base) {
    provider_linked[p] = false;
  }
  let providers: string[] = [];
  for (let p of req2) {
    providers.push(p.provider as string);
    provider_linked[p.provider] = true;
  }
  let role = [];
  if (isAdmin(user)) role.push("Admin");
  if (isContributor(user)) role.push("Contributor");

  return {
    providers,
    name: user.name,
    email: user.email,
    role: role,
    provider_linked,
  } as ProfileData;
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
