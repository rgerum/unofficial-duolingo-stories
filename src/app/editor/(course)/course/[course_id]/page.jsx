import { authOptions } from "app/api/auth/[...nextauth]/authOptions";
import { get_course_editor } from "../../db_get_course_editor";
import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import EditList from "../../edit_list";

export async function generateMetadata({ params }) {
  let course = await get_course_editor(params.course_id);

  if (!course) notFound();

  return {
    title: `${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { redirect: { destination: "/editor/login", permanent: false } };
  }
  if (!session?.user?.role) {
    return {
      redirect: { destination: "/editor/not_allowed", permanent: false },
    };
  }

  let course = await get_course_editor(params.course_id);
  if (!course) notFound();

  //function sleep(ms) {
  //    return new Promise(resolve => setTimeout(resolve, ms));
  //}
  //await sleep(2000);

  return <EditList course={course} />;
}
