import React from "react";
import { redirect } from "next/navigation";
import Welcome from "./welcome";
import { getUser } from "@/lib/userInterface";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Learn with Duostories",
  description:
    "Sign in to track your progress or continue anonymously and learn with Duostories.",
  alternates: {
    canonical: "https://duostories.org/learn",
  },
};

export default async function Page() {
  const user = await getUser();

  if (user?.userId) {
    const lastCourseShort = await fetchAuthQuery(
      api.storyDone.getLastDoneCourseShortForCurrentUser,
    );
    if (lastCourseShort) redirect("/" + lastCourseShort);
  }

  return <Welcome />;
}
