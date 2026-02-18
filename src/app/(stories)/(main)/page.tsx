import Link from "next/link";
import Header from "./header";
import CourseList from "./course_list";
import Icons from "./icons";
import React from "react";
import LandingStatsClient from "./landing_stats_client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export default async function Page({}) {
  const preloadedLandingData = await preloadQuery(
    api.landing.getPublicLandingPageData,
    {},
  );

  // Render data...
  return (
    <>
      <Header>
        <h1>Unofficial Duolingo Stories</h1>
        <p className="[&_a]:underline [&_a]:underline-offset-2">
          A community project to bring the original{" "}
          <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link>{" "}
          to new languages.
          <br />
          <LandingStatsClient preloadedLandingData={preloadedLandingData} />
        </p>
        <p className="[&_a]:underline [&_a]:underline-offset-2">
          If you want to contribute or discuss the stories, meet us on{" "}
          <Link href="https://discord.gg/4NGVScARR3">Discord</Link>
          <br />
          or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
        </p>
        <Icons />
      </Header>
      <CourseList preloadedLandingData={preloadedLandingData} />
    </>
  );
}
