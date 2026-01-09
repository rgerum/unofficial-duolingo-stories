import React from "react";
import styles from "./layout.module.css";
import AdminHeader from "./AdminHeader";

export default async function Layout({ children }) {
  return (
    <div>
      <AdminHeader />
      <div className={styles.main_index}>{children}</div>
    </div>
  );
}
