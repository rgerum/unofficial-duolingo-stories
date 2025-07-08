import React from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/userInterface";

export default async function Layout({ children }) {
  const user = await getUser();

  if (!user?.role) redirect("/auth/editor");

  return <>{children}</>;
}
