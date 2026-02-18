"use client";

import { useState } from "react";
import Link from "next/link";
import Switch from "@/components/ui/switch";
import Button from "@/components/ui/button";
import type { AdminUser } from "./schema";
import {
  setUserActivatedAction,
  setUserWriteAction,
  setUserDeleteAction,
} from "./actions";

async function setUserActivated(data: {
  id: number;
  activated: 0 | 1 | boolean;
}) {
  return await setUserActivatedAction(data);
}

async function setUserWrite(data: { id: number; write: 0 | 1 | boolean }) {
  return await setUserWriteAction(data);
}

async function setUserDelete(data: { id: number }) {
  return await setUserDeleteAction(data);
}

function Activate({ user }: { user: AdminUser }) {
  const [checked, setChecked] = useState(Boolean(user.activated));

  return (
    <span className="inline-flex items-center gap-2">
      <Switch
        checked={checked}
        onClick={async () => {
          const value = await setUserActivated({
            id: user.id,
            activated: checked ? 0 : 1,
          });
          if (value !== undefined) setChecked(!checked);
        }}
      />
      {checked ? "Yes" : "No"}
    </span>
  );
}

function Write({ user }: { user: AdminUser }) {
  const [checked, setChecked] = useState(Boolean(user.role));

  return (
    <span className="inline-flex items-center gap-2">
      <Switch
        checked={checked}
        onClick={async () => {
          const value = await setUserWrite({
            id: user.id,
            write: checked ? 0 : 1,
          });
          if (value !== undefined) setChecked(!checked);
        }}
      />
      {checked ? "Yes" : "No"}
    </span>
  );
}

export default function UserDisplay({ user }: { user: AdminUser }) {
  const [userData] = useState<AdminUser>(user);

  async function removeUser() {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await setUserDelete({ id: userData.id });
    }
  }

  return (
    <div className="mx-auto my-6 mb-10 w-[min(860px,calc(100vw-32px))]">
      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <Link
            className="whitespace-nowrap underline underline-offset-2"
            href="/admin/users"
          >
            Back to Users
          </Link>
          <Button onClick={removeUser}>Delete User</Button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="m-0 text-[2rem] leading-[1.15]">{userData.name}</h1>
        </div>

        <div className="mt-3 mb-5 grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="text-left text-[var(--text-color-dim)] md:text-right">
            User ID
          </div>
          <div className="min-w-0 break-words">{userData.id}</div>

          <div className="text-left text-[var(--text-color-dim)] md:text-right">
            Email
          </div>
          <div className="min-w-0 break-words">{userData.email}</div>

          <div className="text-left text-[var(--text-color-dim)] md:text-right">
            Registered
          </div>
          <div className="min-w-0 break-words">{`${userData.regdate}`}</div>

          <div className="text-left text-[var(--text-color-dim)] md:text-right">
            Activated
          </div>
          <div className="min-w-0 break-words">
            <Activate user={user} />
          </div>

          <div className="text-left text-[var(--text-color-dim)] md:text-right">
            Contributor
          </div>
          <div className="min-w-0 break-words">
            <Write user={user} />
          </div>

          <div className="text-left text-[var(--text-color-dim)] md:text-right">
            Admin
          </div>
          <div className="min-w-0 break-words">
            {userData.admin ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
}
