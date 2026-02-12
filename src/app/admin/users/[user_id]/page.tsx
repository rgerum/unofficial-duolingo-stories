import { notFound } from "next/navigation";
import UserDisplay from "./user_display";
import { UserSchema } from "./schema";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

async function user_properties(id: string) {
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

export default async function Page({
  params,
}: {
  params: Promise<{ user_id: string }>;
}) {
  const user = await user_properties((await params).user_id);
  //console.log(user);

  if (user === undefined) notFound();

  return <UserDisplay user={user} />;
}
