import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import AdminLayout from "@/app/admin/layout";
import UserDisplay from "@/app/admin/users/[user_id]/user_display";
import { UserSchema } from "@/app/admin/users/[user_id]/schema";
import { api } from "@convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";

const getAdminUser = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const parsedId = Number.parseInt(id, 10);
    if (!Number.isFinite(parsedId)) return null;

    const match = await fetchAuthQuery(api.adminData.getAdminUserByLegacyId, {
      id: parsedId,
    });
    if (!match) return null;

    return UserSchema.parse({
      activated: match.activated,
      admin: match.admin,
      discordAccountId: match.discordAccountId,
      discordLinked: match.discordLinked,
      discordStoriesLastSyncedAt:
        typeof match.discordStoriesLastSyncedAt === "number"
          ? new Date(match.discordStoriesLastSyncedAt)
          : undefined,
      discordStoriesRole: match.discordStoriesRole,
      discordStoriesSyncStatus: match.discordStoriesSyncStatus,
      email: match.email,
      id: match.id,
      name: match.name,
      regdate: match.regdate ? new Date(match.regdate) : undefined,
      role: match.role,
    });
  });

export const Route = createFileRoute("/admin/users/$userId")({
  loader: async ({ params }) => {
    const user = await getAdminUser({ data: params.userId });
    if (!user) throw notFound();
    return user;
  },
  component: AdminUserRoute,
});

function AdminUserRoute() {
  return (
    <AdminLayout>
      <UserDisplay user={Route.useLoaderData()} />
    </AdminLayout>
  );
}
