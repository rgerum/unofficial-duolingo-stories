import React from "react";
import { LogInButton, LoggedInButton } from "@/components/login/loggedinbutton";
import { getUser } from "@/lib/userInterface";

export async function LoggedInButtonWrapped(props: {
  course_id?: string;
  page: string;
}) {
  const { course_id, page } = props;
  const user = await getUser();
  if (process.env.DEBUG_AUTH === "true") {
    console.log("[auth] LoggedInButtonWrapped user:", user);
  }

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
