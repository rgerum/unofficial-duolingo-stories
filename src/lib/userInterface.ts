import { redirect } from "next/navigation";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { anyApi } from "convex/server";

type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  image?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  role?: string | null;
};

export type AppUser = Omit<AuthUser, "role"> & {
  rawRole?: string | null;
  role: boolean;
  admin: boolean;
};

const toAppUser = (user: AuthUser | null): AppUser | null => {
  if (!user) return null;

  const roleValue = typeof user.role === "string" ? user.role : "";

  return {
    ...user,
    rawRole: user.role ?? null,
    role: Boolean(roleValue && roleValue !== "user"),
    admin: roleValue === "admin",
  };
};

export async function getUser(
  req?: unknown,
  response?: unknown,
): Promise<AppUser | null> {
  const debugAuth = process.env.DEBUG_AUTH === "true";
  const authed = await isAuthenticated();

  if (debugAuth) {
    console.log("[auth] isAuthenticated:", authed);
  }

  if (!authed) return null;

  try {
    const user = (await fetchAuthQuery(anyApi.auth.getAuthUser)) as AuthUser | null;
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
