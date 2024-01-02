import React, {cache, Suspense} from "react";
import { sql } from "lib/db";
import get_localisation from "lib/get_localisation";
import LanguageButton from "./language_button";

import styles from "./course_list.module.css";
import Legal from "../../../components/layout/legal";

let get_courses = cache(
  async (tag) => {
    let courses = await sql`
SELECT c.id, l1.name AS from_language_name, c.from_language FROM course c
JOIN language l1 ON l1.id = c.from_language
JOIN language l2 ON l2.id = c.learning_language
WHERE ${tag} = ANY(c.tags) AND c.public
ORDER BY COALESCE(NULLIF(c.name, ''), l2.name);
    `;
    // sort courses by base language
    let base_languages = {};
    // iterate over all courses
    for (let course of courses) {
      // if base language not yet in list
      if (base_languages[course.from_language] === undefined) {
        // initialize the list
        base_languages[course.from_language] = [];
      }
      base_languages[course.from_language].push(course.id);
    }

    return base_languages;
  },
  ["get_coursesXXxx"],
);

async function LanguageGroup({ name, tag, id }) {
  let courses = await get_courses(tag ? tag : "main");

  let localisation = await get_localisation(id);
  let courses_list = courses[id];

  if (!courses_list) return <>no list {name}</>;

  return (
    <div className={styles.course_list}>
      <hr />
      <div className={styles.course_group_name}>
        {localisation("stories_for") || `Stories for ${name} Speakers`}
      </div>
      {courses_list?.map((course_id) => (
        <LanguageButton key={course_id} course_id={course_id} />
      ))}
    </div>
  );
}

async function CourseListInner({ loading, tag }) {
  if (loading) {
    return (
      <div className={styles.course_list}>
        <hr />
        <div className={styles.course_group_name}>
          <span className={styles.loading}>Stories for English Speakers</span>
        </div>
        {[...Array(10)].map((d, i) => (
          <LanguageButton key={i} />
        ))}
      </div>
    );
  }
  let course_groups = await get_courses_list(tag ? tag : "main");
  return (
    <>
      {course_groups?.map((group) => (
        <LanguageGroup
          key={group.from_language}
          name={group.from_languagen_ame}
          id={group.from_language}
          tag={tag}
        />
      ))}
    </>
  );
}

let get_courses_list = cache(
  async (tag) => {
    let courses = await sql`SELECT
    l1.name AS from_language_name,
    c.from_language
FROM
    course c
JOIN
    language l1 ON l1.id = c.from_language
WHERE
    ${tag} = ANY(c.tags) AND
    c.public AND
    l1.name != 'English'
GROUP BY
    c.from_language, l1.name
ORDER BY
    from_language_name;
    `;

    // sort courses by base language
    let course_groups = [{ from_language_name: "English", from_language: 1 }];
    // iterate over all courses
    for (let course of courses) {
      course_groups.push(course);
    }

    return course_groups;
  },
  ["get_courses_list2XXyyxxaaxxx"],
);

export default async function CourseList({ tag }) {
  return (
    <Suspense fallback={<CourseListInner loading={true} />}>
        <div>
          <CourseListInner tag={tag} />
        </div>
        <Legal language_name={undefined} />

    </Suspense>
  );
}
