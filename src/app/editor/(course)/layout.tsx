import React from "react";
import EditorLayoutClient from "./layout_client";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorLayoutClient>{children}</EditorLayoutClient>;
} // <Login page={"editor"} course_id={course?.short}/>s
