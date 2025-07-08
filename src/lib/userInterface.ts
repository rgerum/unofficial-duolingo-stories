import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";

export async function getUser(
  req?: NextRequest | undefined,
  response?: NextApiResponse | undefined,
) {
  if (typeof req !== "undefined" && typeof response !== "undefined") {
    const session = await auth();
    //console.log("sessionAPI", session);

    return session?.user;
  }
  const session = await auth();
  //console.log("sessionHTML", session);
  return session?.user;
}

export async function requireAdmin() {
  const user = await getUser();

  if (!user?.admin) redirect("/auth/admin");
}
