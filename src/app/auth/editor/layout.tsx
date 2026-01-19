import React from "react";
import { getUser } from "@/lib/userInterface";
import { redirect } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const user = await getUser();

  if (user?.role === "admin" || user?.role === "editor") redirect("/editor");

  return <>{children}</>;
}
