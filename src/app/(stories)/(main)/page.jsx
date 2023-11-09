import Link from "next/link";
import { query_one_obj } from "lib/db";

import Header from "./header";
import CourseList from "./course_list";
import { unstable_cache } from "next/cache";
import Icons from "./icons";

const get_counts = unstable_cache(async () => {
  return await query_one_obj(`SELECT COUNT(DISTINCT c.id) AS count_courses, COUNT(DISTINCT s.id) as count_stories FROM course c
LEFT JOIN story s ON (c.id = s.course_id)
WHERE s.public = 1 AND s.deleted = 0 AND c.public = 1 LIMIT 1`);
}, ["get_main_counts"]);

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
      <div>
        <CourseList />
      </div>
    </>
  );
}
