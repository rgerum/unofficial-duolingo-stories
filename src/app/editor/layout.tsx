import React from "react";
import { getUser } from "@/lib/userInterface";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  //if (!user?.role) redirect("/auth/editor");

  return <>{children}</>;
}
