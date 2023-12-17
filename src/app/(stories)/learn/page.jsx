import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "app/api/auth/[...nextauth]/route";
import { sql } from "lib/db";
import Welcome from "./welcome";

export const metadata = {
  title: "Duostories FAQ",
  description: "Information about the duostories project.",
  alternates: {
    canonical: "https://duostories.org/faq",
  },
};

async function get_last_course(username) {
  return await sql`SELECT c.short
FROM course c
JOIN story s ON s.course_id = c.id
JOIN story_done sd ON sd.story_id = s.id
JOIN "user" u ON sd.user_id = u.id
WHERE u.username = ${username}
ORDER BY sd.time DESC
LIMIT 1;`;
}

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    let last_course = await get_last_course(session?.user?.name);
    redirect("/" + last_course.short);
  }

  return <Welcome />;
}
