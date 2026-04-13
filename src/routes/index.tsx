import { createFileRoute } from "@tanstack/react-router";
import CourseList from "@/app/(stories)/(main)/course_list";
import Header from "@/app/(stories)/(main)/header";
import Icons from "@/app/(stories)/(main)/icons";
import LandingStatsClient from "@/app/(stories)/(main)/landing_stats_client";
import MainLayout from "@/app/(stories)/(main)/layout";
import Link from "@/lib/router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <MainLayout>
      <Header>
        <h1>Unofficial Duolingo Stories</h1>
        <p className="[&_a]:underline [&_a]:underline-offset-2">
          A community project to bring the original{" "}
          <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link>{" "}
          to new languages.
          <br />
          <LandingStatsClient />
        </p>
        <p className="[&_a]:underline [&_a]:underline-offset-2">
          If you want to contribute or discuss the stories, meet us on{" "}
          <Link href="https://discord.gg/4NGVScARR3">Discord</Link>
          <br />
          or learn more about the project in our <Link href="/faq">FAQ</Link>.
        </p>
        <Icons />
      </Header>
      <CourseList />
    </MainLayout>
  );
}
