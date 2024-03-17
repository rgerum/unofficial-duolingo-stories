import Link from "next/link";
import { authOptions } from "app/api/auth/[...nextauth]/authOptions";
import styles from "./layout.module.css";
import React from "react";
import LoggedInButton, { LogInButton } from "components/login/loggedinbutton";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import AdminHeader from "./AdminHeader";

export default async function Layout({ children }) {
  return (
    <div>
      <AdminHeader />
      <div className={styles.main_index}>{children}</div>
    </div>
  );
}
