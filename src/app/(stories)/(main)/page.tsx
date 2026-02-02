import Link from "next/link";
import Header from "./header";
import { CourseListInner } from "./course_list";
import Icons from "./icons";
import React from "react";
import { get_counts } from "./get_course_data_convex";

export default async function Page({}) {
  const counts = await get_counts();

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
      <CourseListInner />
    </>
  );
}
