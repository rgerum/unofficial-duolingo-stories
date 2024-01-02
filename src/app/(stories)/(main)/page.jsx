import Link from "next/link";
import Header from "./header";
import CourseList from "./course_list";
import Icons from "./icons";
import React, {cache} from "react";
import Legal from "../../../components/layout/legal";
import { sql } from "../../../lib/db";

const get_counts = cache(async () => {
  return (
    await sql`SELECT COUNT(DISTINCT c.id) AS count_courses, COUNT(DISTINCT s.id) as count_stories FROM course c
LEFT JOIN story s ON (c.id = s.course_id)
WHERE s.public AND NOT s.deleted AND c.public`
  )[0];
}, ["get_main_countsTTZT"]);

export default async function Page({}) {
  const counts = await get_counts();

  // Render data...
  return (
    <>
      <Header>
        <h1>Unofficial Duolingo Stories</h1>
        <p>
          A community project to bring the original{" "}
          <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link>{" "}
          to new languages.
          <br />
          {counts.count_stories} stories in {counts.count_courses} courses and
          counting!
        </p>
        <p>
          If you want to contribute or discuss the stories, meet us on{" "}
          <Link href="https://discord.gg/4NGVScARR3">Discord</Link>
          <br />
          or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
        </p>
        <Icons />
      </Header>
      <CourseList />
    </>
  );
}
