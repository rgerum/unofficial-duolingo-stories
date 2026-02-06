import UserList, { type AdminUserList } from "./user_list";
import { fetchAuthQuery } from "@/lib/auth-server";
import { components } from "@convex/_generated/api";

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
  const offset = (page - 1) * PER_PAGE;
  const activatedFilter = normalizeFilter(resolvedSearchParams?.activated);
  const roleFilter = normalizeFilter(resolvedSearchParams?.role);
  const adminFilter = normalizeFilter(resolvedSearchParams?.admin);

  const batchSize = 200;
  let cursor: string | null = null;
  let total = 0;
  const pageUsers: Array<{
    _id: string;
    name?: string;
    email?: string;
    createdAt?: number;
    userId?: string | null;
    role?: string | null;
    emailVerified?: boolean;
  }> = [];

  const targetStart = offset;
  const targetEnd = offset + PER_PAGE;

  while (true) {
    const response = await fetchAuthQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "user",
        where: [],
        paginationOpts: { cursor, numItems: batchSize },
      },
    );

    const batch = response.page as Array<{
      _id: string;
      name?: string;
      email?: string;
      createdAt?: number;
      userId?: string | null;
      role?: string | null;
      emailVerified?: boolean;
    }>;

    for (const user of batch) {
      const name = user.name ?? "";
      const email = user.email ?? "";
      const id = user.userId ?? "";
      if (query) {
        const matches =
          name.toLowerCase().includes(query.toLowerCase()) ||
          email.toLowerCase().includes(query.toLowerCase()) ||
          id === query;
        if (!matches) continue;
      }
      if (activatedFilter !== "all") {
        const activated = Boolean(user.emailVerified);
        if (activatedFilter === "yes" && !activated) continue;
        if (activatedFilter === "no" && activated) continue;
      }
      if (roleFilter !== "all") {
        const hasRole = Boolean(user.role && user.role !== "user");
        if (roleFilter === "yes" && !hasRole) continue;
        if (roleFilter === "no" && hasRole) continue;
      }
      if (adminFilter !== "all") {
        const isAdmin = user.role === "admin";
        if (adminFilter === "yes" && !isAdmin) continue;
        if (adminFilter === "no" && isAdmin) continue;
      }

      if (total >= targetStart && total < targetEnd) {
        pageUsers.push(user);
      }
      total += 1;
    }

    if (response.isDone) break;
    cursor = response.continueCursor ?? null;
  }

  const users: AdminUserList[] = pageUsers.map((user) => ({
    id: user.userId ? Number(user.userId) : 0,
    name: user.name ?? "",
    email: user.email ?? "",
    regdate: user.createdAt ? new Date(user.createdAt) : new Date(),
    activated: Boolean(user.emailVerified),
    role: user.role === "contributor" || user.role === "editor",
    admin: user.role === "admin",
  }));

  return (
    <UserList
      users={users}
      query={query}
      page={page}
      perPage={PER_PAGE}
      total={total}
      activatedFilter={activatedFilter}
      roleFilter={roleFilter}
      adminFilter={adminFilter}
    />
  );
}
