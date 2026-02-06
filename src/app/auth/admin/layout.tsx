import React from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/userInterface";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (user?.admin) redirect("/admin");

  return <>{children}</>;
}
