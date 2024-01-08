import React from "react";

import Header from "../header";

import styles from "./story_button.module.css";
import get_localisation from "lib/get_localisation";
import { sql } from "lib/db";

const get_course_header = async (course_id) => {
  return (
    await sql`
    SELECT COALESCE(NULLIF(course.name, ''), l.name) AS learning_language_name,
       COUNT(course.id) AS count, course.from_language FROM course
    JOIN language l on l.id = course.learning_language
    JOIN story s on course.id = s.course_id
    WHERE s.public AND NOT s.deleted AND course.short = ${course_id} GROUP BY course.id, l.name`
  )[0];
};

export default async function CourseTitle({ course_id }) {
  if (!course_id) {
    return (
      <>
        <Header>
          <h1>
            <span className={styles.animated_background}>
              Unofficial Language Duolingo Stories
            </span>
          </h1>
          <p>
            <span className={styles.animated_background}>
              Learn Language with 000 community translated Duolingo Stories.
            </span>
          </p>
          <p>
            <span className={styles.animated_background}>
              If you want to contribute or discuss the stories, meet us on
              Discord
            </span>
            <br />
            <span className={styles.animated_background}>
              or learn more about the project in our FAQ.
            </span>
          </p>
        </Header>
      </>
    );
  }
  const course = await get_course_header(course_id);

  if (!course)
    return (
      <Header>
        <h1>Course not found.</h1>
      </Header>
    );
  let localisation = await get_localisation(course.from_language);
  //notFound();
  /*
   */
  return (
    <>
      <Header>
        <h1>
          {localisation("course_page_title", {
            $language: course.learning_language_name,
          })}
        </h1>
        <p>
          {localisation("course_page_sub_title", {
            $language: course.learning_language_name,
            $count: course.count,
          })}
        </p>
        <p>
          {localisation("course_page_discuss", {}, [
            "https://discord.gg/4NGVScARR3",
            "/faq",
          ])}
        </p>
      </Header>
    </>
  );
}
