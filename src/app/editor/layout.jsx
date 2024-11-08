
import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Layout({ children }) {
  const session = await auth();

  if (!session?.user?.role) redirect("/auth/editor");

  return <>{children}</>;
}
