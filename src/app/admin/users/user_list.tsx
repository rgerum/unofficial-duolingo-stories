"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { SpinnerBlue } from "@/components/ui/spinner";
import type { AdminUser } from "./[user_id]/schema";

export type AdminUserList = AdminUser & { admin?: boolean; rowKey?: string };

type FilterValue = "all" | "yes" | "no";
type RoleFilterValue = "all" | "user" | "contributor" | "admin";

interface UserListProps {
  users: AdminUserList[];
  query: string;
  limit: number;
  hasMore: boolean;
  loadStep: number;
  activatedFilter: FilterValue;
  roleFilter: RoleFilterValue;
}

type AdminFilters = {
  activated: FilterValue;
  role: RoleFilterValue;
};

function formatRegistered(value: Date | string | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildQueryString(query: string, limit: number, filters: AdminFilters) {
  const params = new URLSearchParams();
  if (query.trim().length > 0) params.set("q", query.trim());
  if (limit > 0) params.set("limit", String(limit));
  if (filters.activated !== "all") params.set("activated", filters.activated);
  if (filters.role !== "all") params.set("role", filters.role);
  const qs = params.toString();
  return qs.length ? `?${qs}` : "";
}

const statusYesClass =
  "inline-block min-w-[38px] rounded-full bg-[color:color-mix(in_srgb,#21c55d_22%,transparent)] px-2.5 py-0.5 text-center text-[0.82rem] font-bold text-[#0a6b2d]";
const statusNoClass =
  "inline-block min-w-[38px] rounded-full bg-[color:color-mix(in_srgb,#ef4444_20%,transparent)] px-2.5 py-0.5 text-center text-[0.82rem] font-bold text-[#9b1c1c]";

function getRoleLabel(user: AdminUserList) {
  if (user.admin) return "Admin";
  if (user.role) return "Contributor";
  return "User";
}

export default function UserList({
  users,
  query,
  limit,
  hasMore,
  loadStep,
  activatedFilter,
  roleFilter,
}: UserListProps) {
  const [search, setSearch] = useState(query);
  const [filters, setFilters] = useState<AdminFilters>({
    activated: activatedFilter,
    role: roleFilter,
  });
  const filtersRef = useRef(filters);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submitSearch(nextLimit = loadStep) {
    startTransition(() => {
      router.push(
        `/admin/users${buildQueryString(search, nextLimit, {
          activated: filters.activated,
          role: filters.role,
        })}`,
      );
    });
  }

  function submitFilters(nextFilters: AdminFilters) {
    startTransition(() => {
      router.push(
        `/admin/users${buildQueryString(search, loadStep, {
          activated: nextFilters.activated,
          role: nextFilters.role,
        })}`,
      );
    });
  }

  function updateFilter(
    key: keyof AdminFilters,
    value: FilterValue | RoleFilterValue,
  ) {
    const nextFilters = { ...filtersRef.current, [key]: value };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    submitFilters(nextFilters);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      submitSearch(loadStep);
    }
  }

  return (
    <div className="relative isolate mx-auto my-6 mb-9 box-border w-full max-w-[min(1240px,calc(100vw-48px))] rounded-[18px] border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-[18px] shadow-[0_18px_42px_color-mix(in_srgb,#000_14%,transparent)]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-0.5 pb-3">
        <div className="flex flex-wrap items-center gap-3.5">
          <Input
            label="Search"
            placeholder="Username, email, or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-2 text-[0.95rem] text-[var(--text-color-dim)]">
              Activated
              <select
                className="min-w-[90px] rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-2.5 py-1.5 text-[var(--text-color)]"
                value={filters.activated}
                onChange={(event) =>
                  updateFilter("activated", event.target.value as FilterValue)
                }
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-[0.95rem] text-[var(--text-color-dim)]">
              Role
              <select
                className="min-w-[120px] rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-2.5 py-1.5 text-[var(--text-color)]"
                value={filters.role}
                onChange={(event) =>
                  updateFilter("role", event.target.value as RoleFilterValue)
                }
              >
                <option value="all">All</option>
                <option value="user">User</option>
                <option value="contributor">Contributor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
        </div>
        <Button onClick={() => submitSearch(loadStep)}>Search</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-0.5 py-3.5">
        <div className="inline-flex items-center gap-2 text-[var(--text-color-dim)]">
          {users.length === 0 ? "No users found." : `Showing ${users.length}`}
          <span
            className={`inline-flex h-5 w-5 items-center ${isPending ? "visible" : "invisible"}`}
            aria-live="polite"
          >
            <SpinnerBlue />
          </span>
        </div>
        {hasMore ? (
          <Button onClick={() => submitSearch(limit + loadStep)}>
            Load more
          </Button>
        ) : null}
      </div>

      <div className="relative isolate overflow-auto rounded-[14px] border border-[color:color-mix(in_srgb,var(--header-border)_60%,transparent)]">
        <table className="w-max min-w-full border-collapse">
          <thead>
            <tr>
              {[
                "ID",
                "Name",
                "Email",
                "Registered",
                "Activated",
                "Role",
                "",
              ].map((header) => (
                <th
                  key={header || "actions"}
                  className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr className="bg-[var(--body-background)]">
                <td colSpan={7} className="px-4 py-2.5">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={user.rowKey ?? `${user.id}-${index}`}
                  className={`${index % 2 === 0 ? "bg-[var(--body-background)]" : "bg-[color:color-mix(in_srgb,var(--body-background-faint)_74%,transparent)]"} hover:brightness-95`}
                >
                  <td className="px-4 py-2.5">{user.id}</td>
                  <td className="max-w-[220px] px-3 py-2.5">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                      {user.name}
                    </span>
                  </td>
                  <td className="max-w-[280px] px-3 py-2.5">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-[0.95rem] tabular-nums">
                    {formatRegistered(user.regdate)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        user.activated ? statusYesClass : statusNoClass
                      }
                    >
                      {user.activated ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{getRoleLabel(user)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Link
                      className="inline-flex min-w-[82px] items-center justify-center rounded-[10px] border-b-[3px] border-[var(--button-border)] bg-[var(--button-background)] px-3 py-1.5 font-bold no-underline"
                      href={`/admin/users/${user.id}`}
                      style={{ color: "#fff" }}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
