"use client";
import React from "react";
import { LogInButton, LoggedInButton } from "@/components/login/loggedinbutton";
import { getUser } from "@/lib/userInterface";
import { authClient } from "@/lib/authClient";

export function LoggedInButtonWrapped(props: {
  course_id?: string;
  page: string;
}) {
  const { course_id, page } = props;
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();
  const user = session?.user;
  console.log(session);
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
