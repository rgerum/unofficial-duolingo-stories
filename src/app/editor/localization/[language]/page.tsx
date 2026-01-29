import React from "react";
import { cache } from "react";
import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import LocalizationEditor from "./localization_editor";

interface LanguageType {
  id: number;
  name: string;
  short: string;
}

interface CourseType {
  learning_language: number;
  from_language: number;
  short: string;
}

interface PageProps {
  params: Promise<{ language: string }>;
}

const get_language = cache(
  async (
    id: string,
  ): Promise<
    [LanguageType | undefined, CourseType | undefined, LanguageType | undefined]
  > => {
    const isNumeric = (value: string) =>
      value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
    if (isNumeric(id)) {
      return [
        (await sql`SELECT * FROM language WHERE id = ${id} LIMIT 1`)[0] as
          | LanguageType
          | undefined,
        undefined,
        undefined,
      ];
    } else {
      let course = (
        await sql`SELECT learning_language, from_language, short FROM course WHERE short = ${id} LIMIT 1`
      )[0] as CourseType | undefined;
      if (course) {
        const langId = course.learning_language;
        let id2 = course.from_language;
        return [
          (
            await sql`SELECT * FROM language WHERE id = ${langId} LIMIT 1`
          )[0] as LanguageType | undefined,
          course,
          (await sql`SELECT * FROM language WHERE id = ${id2} LIMIT 1`)[0] as
            | LanguageType
            | undefined,
        ];
      }
      return [
        (await sql`SELECT * FROM language WHERE short = ${id} LIMIT 1`)[0] as
          | LanguageType
          | undefined,
        undefined,
        undefined,
      ];
    }
  },
);

export async function generateMetadata({ params }: PageProps) {
  let [language, course, language2] = await get_language(
    (await params).language,
  );

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
      canonical: `https://duostories.org/editor/localization/${course?.short}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  let [language, course, language2] = await get_language(
    (await params).language,
  );

  if (!language) {
    notFound();
  }

  // Render data...
  return (
    <>
      <LocalizationEditor
        language={language}
        language2={language2}
        course={course}
      />
    </>
  );
}
