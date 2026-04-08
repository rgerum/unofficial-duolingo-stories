import React from "react";
import { getUser, isContributor } from "@/lib/userInterface";
import { redirect } from "next/navigation";
import { EditorHeaderProvider } from "./_components/header_context";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!isContributor(user)) redirect("/auth/editor");

  return <EditorHeaderProvider>{children}</EditorHeaderProvider>;
}
