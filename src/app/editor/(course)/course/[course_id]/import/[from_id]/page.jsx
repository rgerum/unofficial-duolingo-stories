import {
  get_course_import,
  get_course_data,
  get_course_list_data,
  get_language_list_data,
} from "../../../../db_get_course_editor";
import ImportList from "./import_list";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DoubleFlag } from "@/components/layout/flag.tsx";
import React from "react";
import styles from "./import_list.module.css";

export async function generateMetadata({ params }) {
  const course = await get_course_data((await params).course_id);

  if (!course) notFound();

  return {
    title: `Import | ${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({ params }) {
  const from = (await params).from_id;
  const languages = await get_language_list_data();
  const course = await get_course_data((await params).course_id);
  const courses = await get_course_list_data();
  const course_from = await get_course_data((await params).from_id);

  let imports = await get_course_import({
    from_id: course_from.id,
    course_id: course.id,
  });

  if (!imports) {
    imports = [];
  }

  let course_data = [];
  for (let course of courses) {
    if (course.short === "es-en") course_data.push(course);
  }
  for (let course of courses) {
    if (course.short === "en-es-o") course_data.push(course);
  }
  for (let course of courses) {
    if (
      course.official &&
      course.short !== "es-en" &&
      course.short !== "en-es-o"
    )
      course_data.push(course);
  }

  // Render data...
  return (
    <>
      <div className={styles.lang_selector}>
        {course_data.map((c, i) => (
          <Link
            key={i}
            href={`/editor/course/${course.short}/import/${c.short}`}
          >
            <span className={styles.import_lang}>
              <span className={styles.double_flag}>
                <DoubleFlag
                  width={40}
                  lang1={languages[c.learning_language]}
                  lang2={languages[c.from_language]}
                  className={styles.flag}
                />
              </span>
              <span>
                {languages[c.from_language].short}-
                {languages[c.learning_language].short}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <ImportList
        course={course}
        course_from={course_from}
        imports={imports}
        import_id={from}
      />
    </>
  );
}
