import styles from "./layout.module.css";
import Link from "next/link";
import React from "react";
import { requireAdmin } from "@/lib/userInterface";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";

function AdminButton({
  children,
  href,
  ...delegated
}: {
  children: React.ReactNode;
  href: string;
} & React.HTMLAttributes<HTMLAnchorElement>) {
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
  await requireAdmin();

  return (
    <nav className={styles.header_index}>
      <b>Admin Interface</b>
      <AdminButton href="/admin/users">Users</AdminButton>
      <AdminButton href="/admin/languages">Languages</AdminButton>
      <AdminButton href="/admin/courses">Courses</AdminButton>
      <AdminButton href="/admin/story">Story</AdminButton>

      <div style={{ marginLeft: "auto" }}></div>
      <LoggedInButtonWrappedClient page={"admin"} />
    </nav>
  );
}
