import UserList, { type AdminUserList } from "./user_list";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

const LOAD_STEP = 50;

function normalizeQuery(value: string | string[] | undefined) {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value;
}

type FilterValue = "all" | "yes" | "no";
type RoleFilterValue = "all" | "user" | "contributor" | "admin";

function normalizeFilter(value: string | string[] | undefined): FilterValue {
  const raw = normalizeQuery(value).toLowerCase();
  if (raw === "yes" || raw === "no") return raw;
  return "all";
}

function normalizeRoleFilter(
  value: string | string[] | undefined,
): RoleFilterValue {
  const raw = normalizeQuery(value).toLowerCase();
  if (raw === "contributior") return "contributor";
  if (raw === "user" || raw === "contributor" || raw === "admin") return raw;
  return "all";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawQuery = normalizeQuery(resolvedSearchParams?.q);
  const query = rawQuery.trim();
  const limitRaw = normalizeQuery(resolvedSearchParams?.limit);
  const limit = Math.max(
    1,
    Number.parseInt(limitRaw || String(LOAD_STEP), 10) || LOAD_STEP,
  );
  const activatedFilter = normalizeFilter(resolvedSearchParams?.activated);
  const roleFilter = normalizeRoleFilter(resolvedSearchParams?.role);

  const response = await fetchAuthQuery(api.adminData.getAdminUsersPage, {
    query,
    limit,
    activatedFilter,
    roleFilter,
  });

  const users: AdminUserList[] = response.users.map((user) => ({
    ...user,
    regdate:
      typeof user.regdate === "number" ? new Date(user.regdate) : undefined,
  }));

  return (
    <UserList
      users={users}
      query={query}
      limit={limit}
      hasMore={response.hasMore}
      loadStep={LOAD_STEP}
      activatedFilter={activatedFilter}
      roleFilter={roleFilter}
    />
  );
}
