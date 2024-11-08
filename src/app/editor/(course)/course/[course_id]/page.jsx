
import { get_course_data, get_story_list } from "../../db_get_course_editor";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import EditList from "../../edit_list";

export async function generateMetadata({ params }) {
  let course = await get_course_data(params.course_id);

  if (!course) notFound();

  return {
    title: `${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({ params }) {
  const session = await auth();

  if (!session) {
    return { redirect: { destination: "/editor/login", permanent: false } };
  }
  if (!session?.user?.role) {
    return {
      redirect: { destination: "/editor/not_allowed", permanent: false },
    };
  }

  const course = await get_course_data(params.course_id);
  if (!course) notFound();

  const stories = await get_story_list(course.id);

  //function sleep(ms) {
  //    return new Promise(resolve => setTimeout(resolve, ms));
  //}
  //await sleep(2000);

  return <EditList stories={stories} course={course} />;
}
