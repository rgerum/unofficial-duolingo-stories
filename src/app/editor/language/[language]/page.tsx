import React from "react";
import LanguageEditor from "./language_editor";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  get_avatar_names,
  get_language,
  get_speakers,
} from "@/app/editor/language/[language]/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}): Promise<Metadata> {
  const [language, course, language2] = await get_language(
    (await params).language,
  );

  if (!language2) {
    return {
      title: `Voices | ${language.name} | Duostories Editor`,
      alternates: {
        canonical: `https://duostories.org/editor/language/${language.short}`,
      },
    };
  }

  if (!course) notFound();

  return {
    title: `Voices | ${language.name} (from ${language2.name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/language/${course.short}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  let [language, course, language2] = await get_language(
    (await params).language,
  );

  if (!language) {
    notFound();
  }

  const speakers = await get_speakers(language.id);
  const avatar_names = await get_avatar_names(language.id);

  // Render data...
  return (
    <>
      <LanguageEditor
        language={language}
        language2={language2}
        speakers={speakers}
        avatar_names={avatar_names}
        course={course}
      />
    </>
  );
}
