import { sql } from "@/lib/db";
import UserList, { type AdminUserList } from "./user_list";

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

  const likeQuery = `%${query}%`;
  const conditions = [];
  if (query) {
    conditions.push(
      sql`(name ILIKE ${likeQuery} OR CAST(id AS TEXT) = ${query})`,
    );
  }
  if (activatedFilter !== "all") {
    conditions.push(sql`activated = ${activatedFilter === "yes"}`);
  }
  if (roleFilter !== "all") {
    conditions.push(sql`role = ${roleFilter === "yes"}`);
  }
  if (adminFilter !== "all") {
    conditions.push(sql`admin = ${adminFilter === "yes"}`);
  }
  let whereClause = sql``;
  if (conditions.length > 0) {
    const combined = conditions.reduce((acc, condition, index) => {
      if (index === 0) return condition;
      return sql`${acc} AND ${condition}`;
    });
    whereClause = sql`WHERE ${combined}`;
  }

  const totalRow = (
    await sql`SELECT COUNT(*)::int AS count FROM users ${whereClause};`
  )[0] as { count: number };
  const total = totalRow?.count ?? 0;

  const users = (await sql`
    SELECT id, name, email, regdate, activated, role, admin
    FROM users
    ${whereClause}
    ORDER BY id DESC
    LIMIT ${PER_PAGE} OFFSET ${offset};
  `) as unknown as AdminUserList[];

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
