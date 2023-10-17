import {
  get_course_import,
  get_course_editor,
} from "../../../../db_get_course_editor";
import ImportList from "./import_list";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  let course = await get_course_editor(params.course_id);

  if (!course) notFound();

  return {
    title: `Import | ${course.learningLanguageName} (from ${course.fromLanguageName}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({ params }) {
  let from = params.from_id;
  let course = await get_course_editor(params.course_id);

  let imports = await get_course_import(params);

  if (!imports) {
    imports = [];
  }

  // Render data...
  return (
    <>
      <ImportList course={course} imports={imports} import_id={from} />!
    </>
  );
}
