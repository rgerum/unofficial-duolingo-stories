import { sql } from "lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "app/api/auth/[...nextauth]/authOptions";
import Header from "../header";
import Profile from "./profile";

export const metadata = {
  alternates: {
    canonical: "https://duostories.org/profile",
  },
};

async function get_user_id_from_username(user_name) {
  let res = await sql`SELECT id FROM "user" WHERE username = ${user_name}`;
  if (res.length) return res[0].id;
  return 0;
}

async function getLinkedProviders() {
  let providers_base = ["facebook", "github", "google", "discord"];
  //const token = await getToken({ req })
  const session = await getServerSession(authOptions);
  if (!session) return undefined;
  let user_id = await get_user_id_from_username(session.user.name);
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
  if (session.user.admin) role.push("Admin");
  if (session.user.role) role.push("Contributor");

  return {
    providers,
    name: session.user.name,
    email: session.user.email,
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

  return <Profile providers={providers} />;
}
