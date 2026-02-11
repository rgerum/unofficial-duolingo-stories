import Link from "next/link";
import Header from "./header";
import { CourseListInner } from "./course_list";
import Icons from "./icons";
import React from "react";
import LandingStatsClient from "./landing_stats_client";

export default function Page({}) {
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
          <LandingStatsClient />
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
