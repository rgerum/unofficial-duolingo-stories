import Link from "next/link";
import React from "react";
import { sql, cache } from "@/lib/db";
import styles from "./layout.module.css";
import { auth } from "@/auth";
import CourseDropdown from "./course-dropdown";
import LoggedInButton, { LogInButton } from "@/components/login/loggedinbutton";
import { get_flag_data } from "@/components/layout/flag_by_id";
import { get_course_data } from "./get_course_data";
import getUserId from "@/lib/getUserId";
import styles0 from "./layout.module.css";
import FooterLinks from "./footer_links";
import Legal from "@/components/layout/legal";
import Image from "next/image";

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
  openGraph: {
    title: "Duostories",
    description:
      "Supplement your Duolingo course with community-translated Duolingo stories.",
    type: "website",
    url: `https://duostories.org`,
  },
};

const get_courses_user = cache(
  async (id) => {
    if (!id) return [];
    // sort courses by base language
    return (
      await sql`
SELECT s.course_id
FROM story s
INNER JOIN story_done ON story_done.story_id = s.id
WHERE story_done.user_id = ${id}
GROUP BY s.course_id
ORDER BY MAX(story_done.time) DESC;`
    ).map((r) => r.course_id);
  },
  ["get_courses_user"],
  { tags: ["courses_user"] },
);

export default async function Layout({ children }) {
  // @ts-ignore
  const flag_data = await get_flag_data();
  const course_data = await get_course_data();

  const session = await auth();
  const active_courses = await get_courses_user(await getUserId());

  return (
    <>
      <div className={styles.all_wrapper}>
        <div className={styles.header_wrapper}>
          <nav className={styles.header_index}>
            <Link
              href={"/"}
              className={styles.duostories_title}
              data-cy={"logo"}
            >
              <Image
                src={"/Duostories.svg"}
                alt={"Duostories"}
                height={25}
                width={150.1}
              />
            </Link>
            <div style={{ marginLeft: "auto" }}></div>

            <CourseDropdown
              course_data_active={active_courses}
              course_data={course_data}
              flag_data={flag_data}
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
        </div>
        <main className={styles0.main_index}>{children}</main>
        <FooterLinks />
        <Legal language_name={undefined} />
      </div>
    </>
  );
}
