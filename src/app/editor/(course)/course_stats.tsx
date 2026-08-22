import CourseActivityChart from "./course_activity_chart";
import CourseInterestSummary from "./course_interest_summary";

export default function CourseStats({
  courseIdentifier,
}: {
  courseIdentifier: string | null;
}) {
  return (
    <>
      <CourseInterestSummary courseIdentifier={courseIdentifier} />
      {courseIdentifier ? (
        <CourseActivityChart courseIdentifier={courseIdentifier} />
      ) : null}
    </>
  );
}
