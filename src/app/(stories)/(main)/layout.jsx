import Link from "next/link";
import React from "react";
import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { sql } from "lib/db";
import styles from "./layout.module.css";
import { authOptions } from "app/api/auth/[...nextauth]/authOptions";
import CourseDropdown from "./course-dropdown";
import LoggedInButton, { LogInButton } from "components/login/loggedinbutton";

export const metadata = {
  title:
    "Duostories: improve your Duolingo learning with community translated Duolingo stories.",
  description:
    "Supplement your Duolingo course with community-translated Duolingo stories.",
  alternates: {
    canonical: "https://duostories.org",
  },
  keywords: [
    "language",
    "learning",
    "stories",
    "Duolingo",
    "community",
    "volunteers",
  ],
};

const get_courses_user = cache(async (user_name) => {
  // sort courses by base language
  return await sql`
SELECT course.short
FROM course
INNER JOIN (
    SELECT s.course_id, MAX(story_done.time) as max_story_time
    FROM story s
    INNER JOIN story_done ON story_done.story_id = s.id
    WHERE story_done.user_id = (
        SELECT id FROM "user" WHERE username = ${user_name} LIMIT 1
    )
    GROUP BY s.course_id
) as max_time ON course.id = max_time.course_id
ORDER BY max_time.max_story_time DESC;`;
});

const get_course_flags = cache(async () => {
  const res =
    await sql`SELECT course.id, COALESCE(NULLIF(course.name, ''), l.name) AS name, course.short,
 l.short AS learning_language, l.flag AS learning_language_flag, l.flag_file AS learning_language_flag_file FROM course 
 JOIN language l on l.id = course.learning_language WHERE course.public`;
  const data = {};
  for (let r of res) {
    data[r.short] = r;
  }
  return data;
});

export default async function Layout({ children }) {
  // @ts-ignore
  let all_courses_flags = await get_course_flags();

  const session = await getServerSession(authOptions);

  let active_courses;
  if (session?.user?.name)
    active_courses = await get_courses_user(session.user.name);

  return (
    <>
      <nav className={styles.header_index}>
        <Link href={"/"} className={styles.duostories_title} data-cy={"logo"}>
          <img src={"/Duostories.svg"} alt={"Duostories"} height="25px" />
        </Link>
        <div style={{ marginLeft: "auto" }}></div>

        <CourseDropdown
          course_data={active_courses}
          all_courses_flags={all_courses_flags}
        />
        {session?.user ? (
          <LoggedInButton
            page={"stories"}
            course_id={"segment"}
            session={session}
          />
        ) : (
          <LogInButton />
        )}
      </nav>
      <div className={styles.main_body}>
        <div className={styles.main_index}>{children}</div>
      </div>
    </>
  );
}
