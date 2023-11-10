import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import query, { query_objs } from "lib/db";

import LanguageButton from "./language_button";

import styles from "./course_list.module.css";

let get_courses = unstable_cache(
  async (tag) => {
    let courses = await query(
      `
SELECT c.id, l1.name AS fromLanguageName, c.fromLanguage FROM course c
JOIN course_tag_map ctm on c.id = ctm.course_id
JOIN course_tag ct on ctm.course_tag_id = ct.id
JOIN language l1 ON l1.id = c.fromLanguage
JOIN language l2 ON l2.id = c.learningLanguage
WHERE ct.name = ? AND c.public = 1
GROUP BY c.id ORDER BY COALESCE(NULLIF(c.name, ''), l2.name);
    `,
      [tag],
    );
    // sort courses by base language
    let base_languages = {};
    // iterate over all courses
    for (let course of courses) {
      // if base language not yet in list
      if (base_languages[course.fromLanguage] === undefined) {
        // initialize the list
        base_languages[course.fromLanguage] = [];
      }
      base_languages[course.fromLanguage].push(course.id);
    }

    return base_languages;
  },
  ["get_courses"],
);

async function LanguageGroup({ name, tag, id }) {
  let courses = await get_courses(tag ? tag : "main");
  let courses_list = courses[id];

  if (!courses_list) return <></>;
  console.log(id, courses_list);

  return (
    <div className={styles.course_list}>
      <hr />
      <div className={styles.course_group_name}>
        Stories for {name} Speakers
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
          key={group.fromLanguage}
          name={group.fromLanguageName}
          id={group.fromLanguage}
          tag={tag}
        />
      ))}
    </>
  );
}

let get_courses_list = unstable_cache(
  async (tag) => {
    let courses = await query_objs(
      `
SELECT c.short, l1.name AS fromLanguageName, c.fromLanguage FROM course c
JOIN course_tag_map ctm on c.id = ctm.course_id
JOIN course_tag ct on ctm.course_tag_id = ct.id
JOIN language l1 ON l1.id = c.fromLanguage
WHERE ct.name = 'main' AND c.public = 1 AND l1.name != 'English'
GROUP BY c.fromLanguage
ORDER BY fromLanguageName;
    `,
      [tag],
    );

    // sort courses by base language
    let course_groups = [{ fromLanguageName: "English", fromLanguage: "1" }];
    // iterate over all courses
    for (let course of courses) {
      course_groups.push(course);
    }

    return course_groups;
  },
  ["get_courses_list"],
);

export default async function CourseList({ tag }) {
  return (
    <Suspense fallback={<CourseListInner loading={true} />}>
      <CourseListInner tag={tag} />
    </Suspense>
  );
}
