import React from "react";
import { getUser, isContributor } from "@/lib/userInterface";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!isContributor(user)) redirect("/auth/editor");

  return <>{children}</>;
}
