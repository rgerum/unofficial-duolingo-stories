import React from "react";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/userInterface";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (isAdmin(user)) redirect("/admin");

  return <>{children}</>;
}
