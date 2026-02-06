import { redirect } from "next/navigation";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { anyApi } from "convex/server";

const toAppUser = (
  user: {
    role?: string | null;
    [key: string]: unknown;
  } | null,
) => {
  if (!user) return null;

  const roleValue = typeof user.role === "string" ? user.role : "";

  return {
    ...user,
    role: Boolean(roleValue && roleValue !== "user"),
    admin: roleValue === "admin",
  };
};

export async function getUser(
  req?: unknown,
  response?: unknown,
) {
  const debugAuth = process.env.DEBUG_AUTH === "true";
  const authed = await isAuthenticated();

  if (debugAuth) {
    console.log("[auth] isAuthenticated:", authed);
  }

  if (!authed) return null;

  try {
    const user = await fetchAuthQuery(anyApi.auth.getAuthUser);
    if (debugAuth) {
      console.log("[auth] getAuthUser result:", user);
    }
    return toAppUser(user);
  } catch (error) {
    if (debugAuth) {
      console.log("[auth] getAuthUser error:", error);
    }
    return null;
  }
}

export async function requireAdmin() {
  const user = await getUser();

  if (!user?.admin) redirect("/auth/admin");
}
