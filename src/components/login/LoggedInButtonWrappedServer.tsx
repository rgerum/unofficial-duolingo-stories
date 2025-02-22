import React from "react";
import { LogInButton, LoggedInButton } from "@/components/login/loggedinbutton";
import { getUser } from "@/lib/userInterface";

export async function LoggedInButtonWrapped(props: {
  course_id?: string;
  page: string;
}) {
  const { course_id, page } = props;
  console.log("------------------------LoggedInButtonWrapped", course_id, page);
  const user = await getUser();
  console.log("user", user);
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
