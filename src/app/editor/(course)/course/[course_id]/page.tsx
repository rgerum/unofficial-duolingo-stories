import { get_course_data, get_story_list } from "../../db_get_course_editor";
import { notFound, redirect } from "next/navigation";
import EditList from "../../edit_list";
import { getUser, isContributor } from "@/lib/userInterface";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: number }>;
}): Promise<Metadata> {
  let course = await get_course_data((await params).course_id);

  if (!course) notFound();

  return {
    title: `${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: number }>;
}) {
  const user = await getUser();

  if (!user) {
    //redirect("/editor/login");
  }
  if (!isContributor(user)) {
    //redirect("/editor/not_allowed");
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
