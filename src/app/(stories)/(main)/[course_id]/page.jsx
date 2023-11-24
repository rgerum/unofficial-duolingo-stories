import { Suspense } from "react";
import { query_one_obj } from "lib/db";

import CourseTitle from "./course_title";
import SetList from "./set_list";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import get_localisation from "../../../../lib/get_localisation";

const get_course = unstable_cache(
  async (course_id) => {
    return await query_one_obj(
      `
        SELECT l.name AS learningLanguageName, course.fromLanguage FROM course
        JOIN language l on l.id = course.learningLanguage
        WHERE course.short = ? AND course.public = 1 LIMIT 1
        `,
      [course_id],
    );
  },
  ["get_course_meta"],
);

export async function generateMetadata({ params, searchParams }, parent) {
  if (
    params.course_id.indexOf("-") === -1 ||
    params.course_id.indexOf(".") !== -1
  ) {
    return notFound();
  }
  const course = await get_course(params.course_id);
  const localization = await get_localisation(course.fromLanguage);

  if (!course) notFound();

  const meta = await parent;

  return {
    title:
      localization("meta_course_title", {
        $language: course.learningLanguageName,
      }) || `${course.learningLanguageName} Duolingo Stories`,
    description:
      localization("meta_course_description", {
        $language: course.learningLanguageName,
      }) ||
      `Improve your ${course.learningLanguageName} learning by community-translated Duolingo stories.`,
    alternates: {
      canonical: `https://duostories.org/${params.course_id}`,
    },
    keywords: [course.learningLanguageName, ...meta.keywords],
  };
}

export default async function Page({ params }) {
  if (
    params.course_id.indexOf("-") === -1 ||
    params.course_id.indexOf(".") !== -1
  ) {
    return notFound();
  }

  return (
    <>
      <Suspense fallback={<CourseTitle />}>
        <CourseTitle course_id={params.course_id} />
      </Suspense>

      <Suspense fallback={<SetList />}>
        <SetList course_id={params.course_id} />
      </Suspense>
      <hr />
    </>
  );
}
