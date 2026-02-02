import React from "react";
import Header from "../header";
import styles from "./story_button.module.css";
import get_localisation from "@/lib/get_localisation";
import { get_course } from "../get_course_data_convex";

export default async function CourseTitle({
  course_id,
}: {
  course_id?: string;
}) {
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
  const course = await get_course(course_id);

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
            $count: `${course.count}`,
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
