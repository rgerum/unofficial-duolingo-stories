import { sql } from "@/lib/db";
import Header from "../header";
import Profile from "./profile";
import getUserId from "@/lib/getUserId";
import { getUser } from "@/lib/userInterface";
import { authClient } from "@/lib/authClient";

export const metadata = {
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
  if (user.admin) role.push("Admin");
  if (user.role) role.push("Contributor");

  return {
    providers,
    name: user.name,
    email: user.email,
    role: role,
    provider_linked,
  } as ProfileData;
}

export default async function Page() {
  //const providers = await getLinkedProviders();
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  if (!session) {
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
