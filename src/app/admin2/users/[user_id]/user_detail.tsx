"use client";

import Link from "next/link";
import { useState } from "react";
import type { Admin2User } from "./schema";
import {
  setUserActivatedAction,
  setUserDeleteAction,
  setUserWriteAction,
} from "./actions";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
} from "@/components/ui/shadcn";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 md:grid-cols-[180px_minmax(0,1fr)] md:gap-3">
      <div className="text-sm font-medium text-slate-500 md:text-right">{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function UserDetail({ user }: { user: Admin2User }) {
  const [activated, setActivated] = useState(Boolean(user.activated));
  const [canWrite, setCanWrite] = useState(Boolean(user.role));

  async function removeUser() {
    if (!window.confirm("Delete this user?")) return;
    await setUserDeleteAction({ id: user.id });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin2/users" className="text-sm font-medium text-slate-600 underline underline-offset-2">
          Back to users
        </Link>
        <Button variant="destructive" size="sm" onClick={removeUser}>
          Delete user
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="User ID">{user.id}</Row>
          <Row label="Email">{user.email}</Row>
          <Row label="Registered">{user.regdate ? user.regdate.toLocaleString() : "-"}</Row>
          <Row label="Activated">
            <span className="inline-flex items-center gap-2">
              <Switch
                checked={activated}
                onCheckedChange={async () => {
                  const next = !activated;
                  const result = await setUserActivatedAction({
                    id: user.id,
                    activated: next ? 1 : 0,
                  });
                  if (result === "ok") setActivated(next);
                }}
              />
              <Badge variant={activated ? "success" : "danger"}>{activated ? "Yes" : "No"}</Badge>
            </span>
          </Row>
          <Row label="Contributor">
            <span className="inline-flex items-center gap-2">
              <Switch
                checked={canWrite}
                onCheckedChange={async () => {
                  const next = !canWrite;
                  const result = await setUserWriteAction({
                    id: user.id,
                    write: next ? 1 : 0,
                  });
                  if (result === "ok") setCanWrite(next);
                }}
              />
              <Badge variant={canWrite ? "success" : "danger"}>{canWrite ? "Yes" : "No"}</Badge>
            </span>
          </Row>
          <Row label="Admin">
            <Badge variant={user.admin ? "success" : "danger"}>{user.admin ? "Yes" : "No"}</Badge>
          </Row>
        </CardContent>
      </Card>
    </section>
  );
}
