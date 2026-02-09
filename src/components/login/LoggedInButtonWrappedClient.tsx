"use client";

import React from "react";
import { LogInButton, LoggedInButton } from "@/components/login/loggedinbutton";
import { authClient } from "@/lib/auth-client";

export function LoggedInButtonWrappedClient(props: {
  course_id?: string;
  page: string;
}) {
  const { course_id, page } = props;
  const { data: session } = authClient.useSession();

  const sessionUser = session?.user as
    | {
        role?: string;
        name?: string | null;
        image?: string | null;
      }
    | undefined;

  const user = sessionUser ? sessionUser : undefined;

  return (
    <>
      {user ? (
        <LoggedInButton page={page} course_id={course_id} user={user} />
      ) : (
        <LogInButton />
      )}
    </>
  );
}
