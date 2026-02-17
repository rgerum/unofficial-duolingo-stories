import { notFound } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import { UserSchema } from "./schema";
import UserDetail from "./user_detail";

async function getUser(id: string) {
  const parsedId = Number.parseInt(id, 10);
  if (!Number.isFinite(parsedId)) return undefined;

  const match = await fetchAuthQuery(api.adminData.getAdminUserByLegacyId, {
    id: parsedId,
  });
  if (!match) return undefined;

  return UserSchema.parse({
    id: match.id,
    name: match.name,
    email: match.email,
    regdate: match.regdate ? new Date(match.regdate) : undefined,
    activated: match.activated,
    role: match.role,
    admin: match.admin,
  });
}

export default async function Admin2UserPage({
  params,
}: {
  params: Promise<{ user_id: string }>;
}) {
  const user = await getUser((await params).user_id);
  if (!user) notFound();
  return <UserDetail user={user} />;
}
