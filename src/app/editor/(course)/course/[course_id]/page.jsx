import { get_course_data, get_story_list } from "../../db_get_course_editor";
import { notFound } from "next/navigation";
import EditList from "../../edit_list";
import { getUser } from "@/lib/userInterface";

export async function generateMetadata({ params }) {
  let course = await get_course_data((await params).course_id);

  if (!course) notFound();

  return {
    title: `${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({ params }) {
  const user = await getUser();

  if (!user) {
    return { redirect: { destination: "/editor/login", permanent: false } };
  }
  if (!user?.role) {
    return {
      redirect: { destination: "/editor/not_allowed", permanent: false },
    };
  }

  const course = await get_course_data((await params).course_id);
  if (!course) notFound();

  const stories = await get_story_list(course.id);

  //function sleep(ms) {
  //    return new Promise(resolve => setTimeout(resolve, ms));
  //}
  //await sleep(2000);

  return <EditList stories={stories} course={course} />;
}
