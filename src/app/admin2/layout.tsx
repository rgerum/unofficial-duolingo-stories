import React from "react";
import Admin2Nav from "./_components/Admin2Nav";
import { requireAdmin } from "@/lib/userInterface";

export default async function Admin2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <Admin2Nav />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
