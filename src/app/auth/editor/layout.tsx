import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const session = await auth();

  if (session?.user?.admin) redirect("/editor");

  return <>{children}</>;
}
