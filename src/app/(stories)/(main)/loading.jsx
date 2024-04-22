import { Spinner } from "components/layout/spinner";

import styles from "./layout.module.css";
import Header from "./header";
import Link from "next/link";
import Icons from "./icons";
import { CourseListInner } from "./course_list";
import React from "react";

/*
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

 */

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <>
      <Header>
        <h1>Unofficial Duolingo Stories</h1>
        <p>
          A community project to bring the original{" "}
          <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link>{" "}
          to new languages.
          <br />
          xxxx stories in xx courses and counting!
        </p>
        <p>
          If you want to contribute or discuss the stories, meet us on{" "}
          <Link href="https://discord.gg/4NGVScARR3">Discord</Link>
          <br />
          or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
        </p>
        <Icons />
      </Header>
      <CourseListInner loading={true} />
    </>
  );
}
