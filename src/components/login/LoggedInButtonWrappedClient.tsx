import { useSession } from "next-auth/react";
import React from "react";
import { LogInButton, LoggedInButton } from "@/components/login/loggedinbutton";

export function LoggedInButtonWrappedClient(props: {
  course_id?: string;
  page: string;
}) {
  const { course_id, page } = props;
  const { data: session } = useSession();

  const user = session?.user;

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
