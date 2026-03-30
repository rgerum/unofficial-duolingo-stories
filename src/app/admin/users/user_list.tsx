"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
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

type PendingAction = "search" | "filters" | "loadMore" | null;

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
const statusInfoClass =
  "inline-block min-w-[38px] rounded-full bg-[color:color-mix(in_srgb,#3b82f6_18%,transparent)] px-2.5 py-0.5 text-center text-[0.82rem] font-bold text-[#124f9c]";

function getRoleLabel(user: AdminUserList) {
  if (user.admin) return "Admin";
  if (user.role) return "Contributor";
  return "User";
}

function getStoriesRoleTitle(user: AdminUserList) {
  const parts: string[] = [];
  if (user.discordStoriesSyncStatus) {
    parts.push(`Sync status: ${user.discordStoriesSyncStatus}`);
  }
  if (user.discordStoriesLastSyncedAt) {
    parts.push(
      `Last synced: ${formatRegistered(user.discordStoriesLastSyncedAt)}`,
    );
  }
  return parts.join("\n");
}

const tableHeaders: Array<{ label: string; title?: string; key: string }> = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "activated", label: "", title: "Activated" },
  { key: "role", label: "Role" },
  { key: "discord", label: "", title: "Discord" },
  { key: "stories", label: "Stories" },
  { key: "actions", label: "", title: "Actions" },
];

function ActivatedStatus({ activated }: { activated: boolean | undefined }) {
  if (!activated) {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,#ef4444_16%,transparent)] text-[1rem] font-bold text-[#9b1c1c]"
        title="Not activated"
      >
        -
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,#21c55d_18%,transparent)] text-[1.05rem] font-bold text-[#0a6b2d]"
      title="Activated"
    >
      ✓
    </span>
  );
}

function DiscordAvatar({ user }: { user: AdminUserList }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage =
    user.discordLinked &&
    typeof user.image === "string" &&
    user.image.length > 0 &&
    !imageFailed;
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  if (!user.discordLinked) {
    return (
      <span className={statusNoClass} title="No linked Discord account">
        No
      </span>
    );
  }

  return (
    <div
      className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--profile-background)] font-bold text-[var(--profile-text)]"
      title={
        user.discordAccountId
          ? `Discord account ID: ${user.discordAccountId}`
          : "Linked Discord account"
      }
    >
      {showImage ? (
        <img
          alt=""
          src={user.image ?? undefined}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initial
      )}
    </div>
  );
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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const filtersRef = useRef(filters);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submitSearch(
    nextLimit = loadStep,
    options?: { action?: PendingAction; scroll?: boolean },
  ) {
    const action = options?.action ?? "search";
    const scroll = options?.scroll ?? true;
    setPendingAction(action);
    startTransition(() => {
      router.push(
        `/admin/users${buildQueryString(search, nextLimit, {
          activated: filters.activated,
          role: filters.role,
        })}`,
        { scroll },
      );
    });
  }

  function submitFilters(nextFilters: AdminFilters) {
    setPendingAction("filters");
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
      </div>

      <div className="relative isolate overflow-auto rounded-[14px] border border-[color:color-mix(in_srgb,var(--header-border)_60%,transparent)]">
        <table className="w-max min-w-full border-collapse">
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header.key}
                  className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                  title={header.title}
                >
                  {header.label}
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
                  <td className="px-3 py-2.5">
                    <ActivatedStatus activated={user.activated} />
                  </td>
                  <td className="px-3 py-2.5">{getRoleLabel(user)}</td>
                  <td className="px-3 py-2.5">
                    <DiscordAvatar user={user} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        user.discordStoriesRole
                          ? statusInfoClass
                          : statusNoClass
                      }
                      title={getStoriesRoleTitle(user)}
                    >
                      {user.discordStoriesRole ?? "None"}
                    </span>
                  </td>
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

      {hasMore ? (
        <div className="flex justify-center pt-4">
          <Button
            disabled={isPending && pendingAction === "loadMore"}
            onClick={() =>
              submitSearch(limit + loadStep, {
                action: "loadMore",
                scroll: false,
              })
            }
          >
            <span className="inline-flex items-center gap-2">
              {isPending && pendingAction === "loadMore" ? (
                <span className="inline-flex h-4 w-4 items-center">
                  <SpinnerBlue />
                </span>
              ) : null}
              Load more
            </span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
