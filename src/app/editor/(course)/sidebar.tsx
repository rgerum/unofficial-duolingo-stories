"use client";
import React from "react";
import CourseList from "./course_list";
import { useSelectedLayoutSegments } from "next/navigation";
import { getCourseSegment, shouldShowCourseList } from "./sidebar_state";

interface EditorSidebarLayoutProps {
  children: React.ReactNode;
}

export default function EditorSidebarLayout({
  children,
}: EditorSidebarLayoutProps) {
  const segments = useSelectedLayoutSegments();
  const courseSegment = getCourseSegment(segments);
  const nestedRoute = segments[2];
  const showSidebar =
    nestedRoute !== "story" &&
    nestedRoute !== "voices" &&
    nestedRoute !== "localization";
  // Small screens have no course list drawer: the list is only shown as the
  // full-width content of the editor root, where it replaces the main area.
  const mobileColumns = shouldShowCourseList(segments)
    ? "max-[1250px]:[grid-template-columns:minmax(0,1fr)_0]"
    : "max-[1250px]:[grid-template-columns:0_minmax(0,1fr)]";

  return (
    <div
      className={
        "fixed inset-0 grid h-[100dvh] min-h-0 w-full overflow-hidden [grid-template-areas:'header_header''nav_main'] [grid-template-rows:auto_minmax(0,1fr)] " +
        (showSidebar
          ? `[grid-template-columns:400px_minmax(0,1fr)] ${mobileColumns}`
          : "[grid-template-columns:0_minmax(0,1fr)]")
      }
    >
      {showSidebar ? <CourseList course_id={courseSegment} /> : null}
      {children}
    </div>
  );
}
