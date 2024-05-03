import React from "react";
import { cache } from "react";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth/next";

import { authOptions } from "app/api/auth/[...nextauth]/authOptions";
import { notFound } from "next/navigation";
import LocalizationEditor from "./localization_editor";

const get_avatar_names = cache(async (id) => {
  return await sql`
SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker
FROM (SELECT id, name, speaker, language_id, avatar_id FROM avatar_mapping WHERE language_id = ${id}) as avatar_mapping
RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id
WHERE a.link != '[object Object]'
ORDER BY a.id
    `;
});

const get_speakers = cache(async (id) => {
  return await sql`SELECT * FROM speaker WHERE language_id = ${id}`;
});

const get_language = cache(async (id) => {
  const isNumeric = (value) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
  if (isNumeric(id)) {
    return [
      (await sql`SELECT * FROM language WHERE id = ${id} LIMIT 1`)[0],
      undefined,
      undefined,
    ];
  } else {
    let course = (
      await sql`SELECT learning_language, from_language, short FROM course WHERE short = ${id} LIMIT 1`
    )[0];
    if (course) {
      id = course.learning_language;
      let id2 = course.from_language;
      return [
        (await sql`SELECT * FROM language WHERE id = ${id} LIMIT 1`)[0],
        course,
        (await sql`SELECT * FROM language WHERE id = ${id2} LIMIT 1`)[0],
      ];
    }
    return [
      (await sql`SELECT * FROM language WHERE short = ${id} LIMIT 1`)[0],
      undefined,
      undefined,
    ];
  }
});

export async function generateMetadata({ params }) {
  let [language, course, language2] = await get_language(params.language);

  if (!language) notFound();

  if (!language2) {
    return {
      title: `Voices | ${language.name} | Duostories Editor`,
      alternates: {
        canonical: `https://duostories.org/editor/localization/${language.short}`,
      },
    };
  }

  return {
    title: `Voices | ${language.name} (from ${language2.name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/localization/${course.short}`,
    },
  };
}

export default async function Page({ params }) {
  const session = await getServerSession(authOptions);

  let [language, course, language2] = await get_language(params.language);

  if (!language) {
    notFound();
  }

  let speakers = await get_speakers(language.id);
  let avatar_names = await get_avatar_names(language.id);

  // Render data...
  return (
    <>
      <LocalizationEditor
        language={language}
        language2={language2}
        speakers={speakers}
        avatar_names={avatar_names}
        session={session}
        course={course}
      />
    </>
  );
}
