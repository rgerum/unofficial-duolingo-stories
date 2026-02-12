"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import Input from "@/components/layout/Input";
import Button from "@/components/layout/button";
import { SpinnerBlue } from "@/components/layout/spinner";
import styles from "../index.module.css";
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
    <Wrapper>
      <Header>
        <SearchControls>
          <Input
            label="Search"
            placeholder="Username or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <FilterGroup>
            <label>
              Activated
              <select
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
            <label>
              Contributor
              <select
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
            <label>
              Admin
              <select
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
          </FilterGroup>
        </SearchControls>
        <Button onClick={() => submitSearch(1)}>Search</Button>
      </Header>
      <Meta>
        <MetaLeft>
          {users.length === 0 ? "No users found." : `Showing ${start}-${end}`}
          <SpinnerInline aria-live="polite" data-active={isPending}>
            <SpinnerBlue />
          </SpinnerInline>
        </MetaLeft>
        <Pagination>
          <Button
            onClick={() => submitSearch(Math.max(1, page - 1))}
            disabled={!hasPrevPage}
          >
            Prev
          </Button>
          <PageStatus>Page {page}</PageStatus>
          <Button
            onClick={() => submitSearch(page + 1)}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </Pagination>
      </Meta>
      <table className={styles.admin_table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Registered</th>
            <th>Activated</th>
            <th>Contributor</th>
            <th>Admin</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={8}>No users found.</td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user.rowKey ?? `${user.id}-${index}`}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{`${user.regdate}`}</td>
                <td>{user.activated ? "Yes" : "No"}</td>
                <td>{user.role ? "Yes" : "No"}</td>
                <td>{user.admin ? "Yes" : "No"}</td>
                <td>
                  <Link href={`/admin/users/${user.id}`}>Open</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: min(1200px, 95vw);
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 16px;
`;

const SearchControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  select {
    background: var(--input-background);
    border: 2px solid var(--input-border);
    color: var(--text-color);
    border-radius: 12px;
    padding: 6px 10px;
    font: revert;
    font-size: calc(16 / 16 * 1rem);
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 12px;
  color: var(--text-color);
`;

const MetaLeft = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageStatus = styled.div`
  font-weight: 600;
`;

const SpinnerInline = styled.span`
  display: inline-flex;
  align-items: center;
  width: 20px;
  height: 20px;
  visibility: hidden;

  &[data-active="true"] {
    visibility: visible;
  }

  .spinner {
    width: 20px;
    height: 20px;
  }
`;
