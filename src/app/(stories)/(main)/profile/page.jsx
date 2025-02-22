import { sql } from "@/lib/db";
import Header from "../header";
import Profile from "./profile";
import getUserId from "@/lib/getUserId";
import { getUser } from "@/lib/userInterface";

export const metadata = {
  alternates: {
    canonical: "https://duostories.org/profile",
  },
};

async function getLinkedProviders() {
  let providers_base = ["facebook", "github", "google", "discord"];
  const user = await getUser();
  if (!user) return undefined;
  let user_id = await getUserId();
  const req2 =
    await sql`SELECT provider FROM accounts WHERE "userId" = ${user_id}`;

  let provider_linked = {};
  for (let p of providers_base) {
    provider_linked[p] = false;
  }
  let providers = [];
  for (let p of req2) {
    providers.push(p.provider);
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
  };
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
