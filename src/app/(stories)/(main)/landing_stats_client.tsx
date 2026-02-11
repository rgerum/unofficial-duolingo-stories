"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

export default function LandingStatsClient() {
  const courses = useQuery(api.landing.getPublicCourseList, {});

  if (!courses) {
    return <>... stories in ... courses and counting!</>;
  }

  let countCourses = courses.length;
  let countStories = 0;
  for (const course of courses) {
    countStories += course.count;
  }

  return (
    <>
      {countStories} stories in {countCourses} courses and counting!
    </>
  );
}
