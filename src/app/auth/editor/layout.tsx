import React from "react";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/userInterface";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const user = await getUser();

  if (isAdmin(user)) redirect("/editor");

  return <>{children}</>;
}
