import styles from "./layout.module.css";
import Link from "next/link";
import React from "react";
import LoggedInButton, {
  LogInButton,
} from "../../components/login/loggedinbutton";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";

function AdminButton({ children, href, ...delegated }) {
  return (
    <Link className={styles.editor_button} href={href} {...delegated}>
      <div>
        <img alt="import button" src="/editor/icons/import.svg" />
      </div>
      <span>{children}</span>
    </Link>
  );
}

export default async function AdminHeader() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.admin) redirect("/auth/admin");

  return (
    <nav className={styles.header_index}>
      <b>Admin Interface</b>
      <AdminButton href="/admin/users">Users</AdminButton>
      <AdminButton href="/admin/languages">Languages</AdminButton>
      <AdminButton href="/admin/courses">Courses</AdminButton>
      <AdminButton href="/admin/story">Story</AdminButton>

      <div style={{ marginLeft: "auto" }}></div>
      {session?.user ? (
        <LoggedInButton
          page={"admin"}
          course_id={undefined}
          session={session}
        />
      ) : (
        <LogInButton />
      )}
    </nav>
  );
}
