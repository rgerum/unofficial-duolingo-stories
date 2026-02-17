"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn";

export type Admin2UserList = {
  id: number;
  name: string;
  email: string;
  regdate?: Date;
  activated?: boolean;
  role?: boolean;
  admin?: boolean;
};

type FilterValue = "all" | "yes" | "no";

interface UserListProps {
  users: Admin2UserList[];
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

function Pill({ active }: { active?: boolean }) {
  return <Badge variant={active ? "success" : "danger"}>{active ? "Yes" : "No"}</Badge>;
}

export default function UsersTable({
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
        `/admin2/users${buildQueryString(search, nextPage, {
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
        `/admin2/users${buildQueryString(search, 1, {
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
    <section className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full min-w-[220px] space-y-1.5 sm:w-[260px]">
                <Label htmlFor="users-search">Search</Label>
                <Input
                  id="users-search"
                  placeholder="Username or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {([
                ["Activated", activated, setActivated],
                ["Contributor", role, setRole],
                ["Admin", admin, setAdmin],
              ] as const).map(([label, value, setValue]) => (
                <div key={label} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Select
                    className="min-w-[110px]"
                    value={value}
                    onChange={(event) => {
                      const next = event.target.value as FilterValue;
                      setValue(next);
                      submitFilters({
                        activated: label === "Activated" ? next : activated,
                        role: label === "Contributor" ? next : role,
                        admin: label === "Admin" ? next : admin,
                      });
                    }}
                    options={[
                      { label: "All", value: "all" },
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                </div>
              ))}
            </div>
            <Button onClick={() => submitSearch(1)}>Search</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <div>
          {users.length === 0 ? "No users found." : `Showing ${start}-${end}`}
          {isPending ? <span className="ml-2 text-slate-400">Updating...</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => submitSearch(Math.max(1, page - 1))}
            disabled={!hasPrevPage}
          >
            Prev
          </Button>
          <span className="font-semibold">Page {page}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => submitSearch(page + 1)}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>

      <Card className="overflow-auto">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow className="border-b-0">
              {["ID", "Name", "Email", "Registered", "Activated", "Contributor", "Admin", ""].map(
                (header) => (
                  <TableHead key={header || "actions"}>{header}</TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-slate-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={`${user.id}-${index}`}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{formatRegistered(user.regdate)}</TableCell>
                  <TableCell>
                    <Pill active={user.activated} />
                  </TableCell>
                  <TableCell>
                    <Pill active={user.role} />
                  </TableCell>
                  <TableCell>
                    <Pill active={user.admin} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin2/users/${user.id}`} className={buttonVariants({ size: "sm" })}>
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
