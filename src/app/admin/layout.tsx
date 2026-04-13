import React from "react";
import AdminHeader from "./AdminHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminHeader />
      <div className="overflow-x-hidden">{children}</div>
    </div>
  );
}
