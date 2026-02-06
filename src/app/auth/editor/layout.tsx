import React from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/userInterface";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const user = await getUser();

  if (user?.admin) redirect("/editor");

  return <>{children}</>;
}
