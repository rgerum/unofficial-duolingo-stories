import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { headers } from "next/headers"; // import the auth client

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  //console.log("sessionHTML", session);
  return session?.user;
}

export async function requireAdmin() {
  const user = await getUser();
  console.log(user);
  if (user?.role != "admin") redirect("/auth/admin");
}
