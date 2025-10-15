import React from "react";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Welcome from "./welcome";
import { getUser } from "@/lib/userInterface";

export const metadata = {
  title: "Duostories FAQ",
  description: "Information about the duostories project.",
  alternates: {
    canonical: "https://duostories.org/faq",
  },
};

async function get_last_course(name: string) {
  return await sql`SELECT c.short
FROM course c
JOIN story s ON s.course_id = c.id
JOIN story_done sd ON sd.story_id = s.id
JOIN "users" u ON sd.user_id = u.id
WHERE u.name = ${name}
ORDER BY sd.time DESC
LIMIT 1;`;
}

export default async function Page() {
  const user = await getUser();

  if (user && user?.name) {
    let last_course = await get_last_course(user?.name);
    if (last_course.length && last_course[0].short)
      redirect("/" + last_course[0].short);
  }

  return <Welcome />;
}
