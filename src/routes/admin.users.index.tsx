import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import AdminLayout from "@/app/admin/layout";
import UserList, { type AdminUserList } from "@/app/admin/users/user_list";
import { api } from "@convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";

const LOAD_STEP = 50;

const normalizeQuery = (value: string | string[] | undefined) => {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
};

type FilterValue = "all" | "yes" | "no";
type RoleFilterValue = "all" | "user" | "contributor" | "admin";

const getAdminUsersPage = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      activatedFilter: FilterValue;
      limit: number;
      query: string;
      roleFilter: RoleFilterValue;
    }) => data,
  )
  .handler(async ({ data }) => {
    const response = await fetchAuthQuery(
      api.adminData.getAdminUsersPage,
      data,
    );

    const users: AdminUserList[] = response.users.map((user) => ({
      ...user,
      regdate:
        typeof user.regdate === "number" ? new Date(user.regdate) : undefined,
      discordStoriesLastSyncedAt:
        typeof user.discordStoriesLastSyncedAt === "number"
          ? new Date(user.discordStoriesLastSyncedAt)
          : undefined,
    }));

    return { hasMore: response.hasMore, users };
  });

export const Route = createFileRoute("/admin/users/")({
  loader: async ({ location }) => {
    const searchParams = new URLSearchParams(location.search);
    const query = normalizeQuery(searchParams.get("q") ?? undefined).trim();
    const limitRaw = normalizeQuery(searchParams.get("limit") ?? undefined);
    const limit = Math.max(
      1,
      Number.parseInt(limitRaw || String(LOAD_STEP), 10) || LOAD_STEP,
    );
    const activatedFilter = (
      ["yes", "no"].includes(searchParams.get("activated") ?? "")
        ? searchParams.get("activated")
        : "all"
    ) as FilterValue;
    const roleFilter = (
      ["user", "contributor", "admin"].includes(searchParams.get("role") ?? "")
        ? searchParams.get("role")
        : "all"
    ) as RoleFilterValue;

    const response = await getAdminUsersPage({
      data: { activatedFilter, limit, query, roleFilter },
    });

    return {
      activatedFilter,
      hasMore: response.hasMore,
      limit,
      loadStep: LOAD_STEP,
      query,
      roleFilter,
      users: response.users,
    };
  },
  component: AdminUsersIndexRoute,
});

function AdminUsersIndexRoute() {
  const loaderData = Route.useLoaderData();

  return (
    <AdminLayout>
      <UserList
        activatedFilter={loaderData.activatedFilter}
        hasMore={loaderData.hasMore}
        limit={loaderData.limit}
        loadStep={loaderData.loadStep}
        query={loaderData.query}
        roleFilter={loaderData.roleFilter}
        users={loaderData.users}
      />
    </AdminLayout>
  );
}
