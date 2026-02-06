import { notFound } from "next/navigation";
import UserDisplay from "./user_display";
import { UserSchema } from "./schema";
import { fetchAuthQuery } from "@/lib/auth-server";
import { components } from "@convex/_generated/api";

async function user_properties(id: string) {
  const response = await fetchAuthQuery(
    components.betterAuth.adapter.findMany,
    {
      model: "user",
      where: [],
      paginationOpts: { cursor: null, numItems: 1000 },
    },
  );

  const users = response.page as Array<{
    _id: string;
    userId?: string | null;
    name?: string;
    email?: string;
    createdAt?: number;
    role?: string | null;
  }>;

  const match = users.find((user) => {
    if (user.userId === id) return true;
    if (user.name && user.name.replace(/\s+/g, "") === id.replace("%20", "")) {
      return true;
    }
    return false;
  });

  if (!match) return undefined;

  return UserSchema.parse({
    id: match.userId ? Number(match.userId) : 0,
    name: match.name ?? "",
    email: match.email ?? "",
    regdate: match.createdAt ? new Date(match.createdAt) : undefined,
    activated: true,
    role: match.role === "contributor" || match.role === "editor",
    admin: match.role === "admin",
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
