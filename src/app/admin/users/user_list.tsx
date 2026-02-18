"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { SpinnerBlue } from "@/components/ui/spinner";
import type { AdminUser } from "./[user_id]/schema";

export type AdminUserList = AdminUser & { admin?: boolean; rowKey?: string };

type FilterValue = "all" | "yes" | "no";

interface UserListProps {
  users: AdminUserList[];
  query: string;
  page: number;
  perPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  activatedFilter: FilterValue;
  roleFilter: FilterValue;
  adminFilter: FilterValue;
}

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

function buildQueryString(
  query: string,
  page: number,
  filters: { activated: FilterValue; role: FilterValue; admin: FilterValue },
) {
  const params = new URLSearchParams();
  if (query.trim().length > 0) params.set("q", query.trim());
  if (page > 1) params.set("page", String(page));
  if (filters.activated !== "all") params.set("activated", filters.activated);
  if (filters.role !== "all") params.set("role", filters.role);
  if (filters.admin !== "all") params.set("admin", filters.admin);
  const qs = params.toString();
  return qs.length ? `?${qs}` : "";
}

const statusYesClass =
  "inline-block min-w-[38px] rounded-full bg-[color:color-mix(in_srgb,#21c55d_22%,transparent)] px-2.5 py-0.5 text-center text-[0.82rem] font-bold text-[#0a6b2d]";
const statusNoClass =
  "inline-block min-w-[38px] rounded-full bg-[color:color-mix(in_srgb,#ef4444_20%,transparent)] px-2.5 py-0.5 text-center text-[0.82rem] font-bold text-[#9b1c1c]";

export default function UserList({
  users,
  query,
  page,
  perPage,
  hasPrevPage,
  hasNextPage,
  activatedFilter,
  roleFilter,
  adminFilter,
}: UserListProps) {
  const [search, setSearch] = useState(query);
  const [activated, setActivated] = useState<FilterValue>(activatedFilter);
  const [role, setRole] = useState<FilterValue>(roleFilter);
  const [admin, setAdmin] = useState<FilterValue>(adminFilter);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const start = users.length === 0 ? 0 : (page - 1) * perPage + 1;
  const end = users.length === 0 ? 0 : start + users.length - 1;

  function submitSearch(nextPage = 1) {
    startTransition(() => {
      router.push(
        `/admin/users${buildQueryString(search, nextPage, {
          activated,
          role,
          admin,
        })}`,
      );
    });
  }

  function submitFilters(nextFilters: {
    activated: FilterValue;
    role: FilterValue;
    admin: FilterValue;
  }) {
    startTransition(() => {
      router.push(
        `/admin/users${buildQueryString(search, 1, {
          activated: nextFilters.activated,
          role: nextFilters.role,
          admin: nextFilters.admin,
        })}`,
      );
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      submitSearch(1);
    }
  }

  return (
    <div className="relative isolate mx-auto my-6 mb-9 box-border w-full max-w-[min(1240px,calc(100vw-48px))] rounded-[18px] border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-[18px] shadow-[0_18px_42px_color-mix(in_srgb,#000_14%,transparent)]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-0.5 pb-3">
        <div className="flex flex-wrap items-center gap-3.5">
          <Input
            label="Search"
            placeholder="Username or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-2 text-[0.95rem] text-[var(--text-color-dim)]">
              Activated
              <select
                className="min-w-[90px] rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-2.5 py-1.5 text-[var(--text-color)]"
                value={activated}
                onChange={(event) => {
                  const next = event.target.value as FilterValue;
                  setActivated(next);
                  submitFilters({ activated: next, role, admin });
                }}
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-[0.95rem] text-[var(--text-color-dim)]">
              Contributor
              <select
                className="min-w-[90px] rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-2.5 py-1.5 text-[var(--text-color)]"
                value={role}
                onChange={(event) => {
                  const next = event.target.value as FilterValue;
                  setRole(next);
                  submitFilters({ activated, role: next, admin });
                }}
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-[0.95rem] text-[var(--text-color-dim)]">
              Admin
              <select
                className="min-w-[90px] rounded-xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-2.5 py-1.5 text-[var(--text-color)]"
                value={admin}
                onChange={(event) => {
                  const next = event.target.value as FilterValue;
                  setAdmin(next);
                  submitFilters({ activated, role, admin: next });
                }}
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        </div>
        <Button onClick={() => submitSearch(1)}>Search</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-0.5 py-3.5">
        <div className="inline-flex items-center gap-2 text-[var(--text-color-dim)]">
          {users.length === 0 ? "No users found." : `Showing ${start}-${end}`}
          <span
            className={`inline-flex h-5 w-5 items-center ${isPending ? "visible" : "invisible"}`}
            aria-live="polite"
          >
            <SpinnerBlue />
          </span>
        </div>
        <div className="inline-flex items-center gap-2.5">
          <Button
            onClick={() => submitSearch(Math.max(1, page - 1))}
            disabled={!hasPrevPage}
          >
            Prev
          </Button>
          <div className="min-w-[60px] text-center font-bold">Page {page}</div>
          <Button
            onClick={() => submitSearch(page + 1)}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="relative isolate overflow-auto rounded-[14px] border border-[color:color-mix(in_srgb,var(--header-border)_60%,transparent)]">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              {[
                "ID",
                "Name",
                "Email",
                "Registered",
                "Activated",
                "Contributor",
                "Admin",
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
                <td colSpan={8} className="px-4 py-2.5">
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
                  <td className="px-3 py-2.5">{user.name}</td>
                  <td className="px-3 py-2.5">{user.email}</td>
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
                  <td className="px-3 py-2.5">
                    <span
                      className={user.role ? statusYesClass : statusNoClass}
                    >
                      {user.role ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={user.admin ? statusYesClass : statusNoClass}
                    >
                      {user.admin ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Link
                      className="inline-flex min-w-[82px] items-center justify-center rounded-[10px] border-b-[3px] border-[var(--button-border)] bg-[var(--button-background)] px-3 py-1.5 font-bold text-[var(--button-color)] no-underline"
                      href={`/admin/users/${user.id}`}
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
