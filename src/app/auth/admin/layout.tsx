import React from "react";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/userInterface";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (isAdmin(user)) redirect("/admin");

  return <>{children}</>;
}
