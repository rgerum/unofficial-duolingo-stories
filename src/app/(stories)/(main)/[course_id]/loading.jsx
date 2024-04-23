import React from "react";
import CourseTitle from "./course_title";
import SetList from "./set_list";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <>
      <CourseTitle />
      <SetList />
    </>
  );
}
