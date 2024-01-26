import React, { Suspense } from "react";
import get_localisation from "lib/get_localisation";
import LanguageButton from "./language_button";

import styles from "./course_list.module.css";
import Legal from "../../../components/layout/legal";
import { get_course_groups, get_courses_in_group } from "./get_course_data";
import FooterLinks from "./footer_links";

async function LanguageGroup({ name, tag, id }) {
  let courses_list = await get_courses_in_group(id);

  let localisation = await get_localisation(id);

  if (!courses_list) return <>no list {name}</>;

  return (
    <div className={styles.course_list}>
      <hr />
      <div className={styles.course_group_name}>
        {localisation("stories_for")}
      </div>
      {courses_list?.map((course) => (
        <LanguageButton key={course.id} course_id={course.short} />
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
          <LanguageButton key={i} loading={true} />
        ))}
      </div>
    );
  }
  let course_groups = await get_course_groups();
  return (
    <>
      {course_groups?.map((group) => (
        <LanguageGroup
          key={group.from_language}
          name={group.from_language_name}
          id={group.from_language}
          tag={tag}
        />
      ))}
    </>
  );
}

export default async function CourseList({ tag }) {
  return (
    <Suspense fallback={<CourseListInner loading={true} />}>
      <div>
        <CourseListInner tag={tag} />
      </div>
      <FooterLinks />
      <Legal language_name={undefined} />
    </Suspense>
  );
}
