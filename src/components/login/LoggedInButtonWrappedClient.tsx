import { useSession } from "next-auth/react";
import React from "react";
import { LogInButton, LoggedInButton } from "@/components/login/loggedinbutton";

export function LoggedInButtonWrappedClient(props: {
  course_id?: string;
  page: string;
}) {
  const { course_id, page } = props;
  const { data: session } = useSession();

  console.log(
    "------------------------LoggedInButtonWrappedClient",
    course_id,
    page,
  );
  const user = session?.user;
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
