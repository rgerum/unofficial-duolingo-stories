import React from "react";
import { LogInButton, LoggedInButton } from "@/components/login/loggedinbutton";
import { getUser } from "@/lib/userInterface";

export async function LoggedInButtonWrapped(props: {
  course_id?: string;
  page: string;
}) {
  const { course_id, page } = props;
  const user = await getUser();

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
