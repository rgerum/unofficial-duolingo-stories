import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getUser(req?: Request | undefined) {
  const session = await auth();
  return session?.user;
  //  return { admin: false };
}

export async function requireAdmin() {
  const user = await getUser();

  if (!user?.admin) redirect("/auth/admin");
}
