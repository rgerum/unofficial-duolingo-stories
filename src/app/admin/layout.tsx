import React from "react";
import styles from "./layout.module.css";
import AdminHeader from "./AdminHeader";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AdminHeader />
      <div className={styles.main_index}>{children}</div>
    </div>
  );
}
