import { redirect } from "next/navigation";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import type { UserIdentity } from "convex/server";

type AuthUser = {
  _id: string;
  userId: string;
  name?: string;
  email?: string;
  image?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  role?: string | null;
};

type AppUser = Omit<AuthUser, "role" | "userId"> & {
  userId: number;
  rawRole?: string | null;
  role: boolean;
  admin: boolean;
};

const toAppUser = (user: AuthUser | null): AppUser | null => {
  if (!user) return null;

  const parsedUserId = Number.parseInt(user.userId, 10);
  if (Number.isNaN(parsedUserId)) return null;

  const roleValue = typeof user.role === "string" ? user.role : "";

  return {
    ...user,
    userId: parsedUserId,
    rawRole: user.role ?? null,
    role: roleValue === "contributor" || roleValue === "admin",
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
    const user = (await fetchAuthQuery(
      api.auth.getCurrentUser,
    )) as AuthUser | null;
    const appUser = toAppUser(user);
    if (debugAuth) {
      console.log("[auth] getAuthUser result:", appUser);
    }
    return appUser;
  } catch (error) {
    if (debugAuth) {
      console.log("[auth] getAuthUser error:", error);
    }
    return null;
  }
}

export async function requireAdmin() {
  const user = await getUser();

  if (!isAdmin(user)) redirect("/auth/admin");
}

type RoleLike =
  | UserIdentity
  | AppUser
  | {
      role?: unknown;
      admin?: unknown;
    }
  | null;

export function isAdmin(user: RoleLike) {
  if (!user) return false;
  if (typeof (user as AppUser).admin === "boolean")
    return (user as AppUser).admin;
  return (user as UserIdentity).role === "admin";
}

export function isContributor(user: RoleLike) {
  if (!user) return false;
  if (typeof (user as AppUser).role === "boolean")
    return (
      (user as AppUser).role || (user as AppUser).admin === true
    );
  const role = (user as UserIdentity).role;
  return role === "contributor" || role === "admin";
}
