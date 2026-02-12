import UserList, { type AdminUserList } from "./user_list";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

const PER_PAGE = 50;

function normalizeQuery(value: string | string[] | undefined) {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value;
}

type FilterValue = "all" | "yes" | "no";

function normalizeFilter(value: string | string[] | undefined): FilterValue {
  const raw = normalizeQuery(value).toLowerCase();
  if (raw === "yes" || raw === "no") return raw;
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
  const pageRaw = normalizeQuery(resolvedSearchParams?.page);
  const page = Math.max(1, Number.parseInt(pageRaw || "1", 10) || 1);
  const activatedFilter = normalizeFilter(resolvedSearchParams?.activated);
  const roleFilter = normalizeFilter(resolvedSearchParams?.role);
  const adminFilter = normalizeFilter(resolvedSearchParams?.admin);

  const response = await fetchAuthQuery(api.adminData.getAdminUsersPage, {
    query,
    page,
    perPage: PER_PAGE,
    activatedFilter,
    roleFilter,
    adminFilter,
  });

  const users: AdminUserList[] = response.users.map((user) => ({
    ...user,
    regdate: user.regdate ? new Date(user.regdate) : undefined,
  }));

  return (
    <UserList
      users={users}
      query={query}
      page={page}
      perPage={PER_PAGE}
      hasPrevPage={response.hasPrevPage}
      hasNextPage={response.hasNextPage}
      activatedFilter={activatedFilter}
      roleFilter={roleFilter}
      adminFilter={adminFilter}
    />
  );
}
