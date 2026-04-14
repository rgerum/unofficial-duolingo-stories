"use client";

import { useState } from "react";
import Link from "next/link";
import Switch from "@/components/ui/switch";
import Button from "@/components/ui/button";
import {
  adminDetailCardClass,
  adminDetailLabelClass,
  adminDetailPageClass,
} from "@/app/admin/adminDetailStyles";
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
    <div className={adminDetailPageClass}>
      <div className={adminDetailCardClass}>
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
          <h1 className="m-0 text-3xl leading-tight">{userData.name}</h1>
        </div>

        <div className="mt-3 mb-5 grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className={adminDetailLabelClass}>User ID</div>
          <div className="min-w-0 break-words">{userData.id}</div>

          <div className={adminDetailLabelClass}>Email</div>
          <div className="min-w-0 break-words">{userData.email}</div>

          <div className={adminDetailLabelClass}>Registered</div>
          <div className="min-w-0 break-words">{`${userData.regdate}`}</div>

          <div className={adminDetailLabelClass}>Activated</div>
          <div className="min-w-0 break-words">
            <Activate user={user} />
          </div>

          <div className={adminDetailLabelClass}>Contributor</div>
          <div className="min-w-0 break-words">
            <Write user={user} />
          </div>

          <div className={adminDetailLabelClass}>Admin</div>
          <div className="min-w-0 break-words">
            {userData.admin ? "Yes" : "No"}
          </div>

          <div className={adminDetailLabelClass}>Discord</div>
          <div className="min-w-0 break-words">
            {userData.discordLinked
              ? `Linked${userData.discordAccountId ? ` (${userData.discordAccountId})` : ""}`
              : "Not linked"}
          </div>

          <div className={adminDetailLabelClass}>Stories role</div>
          <div className="min-w-0 break-words">
            {userData.discordStoriesRole ?? "None"}
            {userData.discordStoriesSyncStatus
              ? ` (${userData.discordStoriesSyncStatus})`
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
