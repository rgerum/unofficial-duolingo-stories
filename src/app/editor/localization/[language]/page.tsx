import React from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
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

async function get_language(
  id: string,
): Promise<
  [LanguageType | undefined, CourseType | undefined, LanguageType | undefined]
> {
  const result = await fetchQuery(api.editor.getLanguageWithCourse, { id });

  if (!result) {
    return [undefined, undefined, undefined];
  }

  const language: LanguageType = {
    id: result.language.id,
    name: result.language.name,
    short: result.language.short,
  };

  const course: CourseType | undefined = result.course
    ? {
        learning_language: result.course.learning_language,
        from_language: result.course.from_language,
        short: result.course.short,
      }
    : undefined;

  const language2: LanguageType | undefined = result.fromLanguage
    ? {
        id: result.fromLanguage.id,
        name: result.fromLanguage.name,
        short: result.fromLanguage.short,
      }
    : undefined;

  return [language, course, language2];
}

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
