"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CourseList } from "./courses";
import { Spinner } from "@/components/ui/spinner";

export default function CourseListClient() {
  const data = useQuery(api.adminData.getAdminCourses, {});

  if (data === undefined) return <Spinner />;
  return <CourseList all_courses={data.courses} languages={data.languages} />;
}
