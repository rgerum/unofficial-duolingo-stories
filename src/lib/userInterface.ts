import { redirect } from "next/navigation";
import { NextApiResponse } from "next";
import { NextRequest } from "next/server";
import { authClient } from "@/lib/authClient"; // import the auth client

export async function getUser(
  req?: NextRequest | undefined,
  response?: NextApiResponse | undefined,
) {
  if (typeof req !== "undefined" && typeof response !== "undefined") {
    const { data: session } = await authClient.getSession();
    //console.log("sessionAPI", session);

    return session?.user;
  }
  const { data: session } = await authClient.getSession();
  //console.log("sessionHTML", session);
  return session?.user;
}

export async function requireAdmin() {
  const user = await getUser();

  if (!user?.admin) redirect("/auth/admin");
}
