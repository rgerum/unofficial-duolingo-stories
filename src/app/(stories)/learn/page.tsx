import React from "react";
import { redirect } from "next/navigation";
import Welcome from "./welcome";
import { getUser } from "@/lib/userInterface";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

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
    const lastCourseShort = await fetchQuery(
      api.storyDone.getLastDoneCourseShortForLegacyUser,
      {
        legacyUserId: user.userId,
      },
    );
    if (lastCourseShort) redirect("/" + lastCourseShort);
  }

  return <Welcome />;
}
