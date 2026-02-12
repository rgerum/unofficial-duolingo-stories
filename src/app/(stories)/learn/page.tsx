import React from "react";
import { redirect } from "next/navigation";
import Welcome from "./welcome";
import { getUser } from "@/lib/userInterface";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export const metadata = {
  title: "Duostories FAQ",
  description: "Information about the duostories project.",
  alternates: {
    canonical: "https://duostories.org/faq",
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
