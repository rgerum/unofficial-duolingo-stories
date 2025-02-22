import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { auth } from "@/auth";

export async function getUser(req?: Request | undefined) {
  if (req) {
    const token = await getToken({ req });
  }
  const session = await auth();
  return session?.user;
  //  return { admin: false };
}

export async function requireAdmin() {
  const user = await getUser();

  if (!user?.admin) redirect("/auth/admin");
}
