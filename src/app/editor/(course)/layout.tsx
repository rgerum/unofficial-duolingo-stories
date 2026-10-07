import React from "react";
import EditorLayoutClient from "./layout_client";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorLayoutClient>{children}</EditorLayoutClient>;
} // <Login page={"editor"} course_id={course?.short}/>s
