import React from "react";
import { redirect } from "@/lib/router";
import { getUser, isAdmin } from "@/lib/userInterface";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const user = await getUser();

  if (isAdmin(user)) redirect("/editor");

  return <>{children}</>;
}
