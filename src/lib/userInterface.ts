"use server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NextApiRequest, NextApiResponse } from "next";

export async function getUser(
  req?: NextApiRequest | undefined,
  response?: NextApiResponse | undefined,
) {
  if (typeof req !== "undefined" && typeof response !== "undefined") {
    const session = await auth(req, response);
    console.log("sessionAPI", session);

    return session?.user;
  }
  const session = await auth();
  console.log("sessionHTML", session);
  return session?.user;
  return { admin: false };
}

export async function requireAdmin() {
  const user = await getUser();

  if (!user?.admin) redirect("/auth/admin");
}
