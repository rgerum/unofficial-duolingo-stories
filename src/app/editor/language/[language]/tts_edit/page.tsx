import React from "react";
import { notFound } from "next/navigation";
import Tts_edit from "./tts_edit";
import { getUser } from "@/lib/userInterface";
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
      title: `Voices Edit | ${language.name} | Duostories Editor`,
      alternates: {
        canonical: `https://duostories.org/editor/language/${language.short}/tts_edit`,
      },
    };
  }

  if (!course) notFound();

  return {
    title: `Voices Edit | ${language.name} (from ${language2.name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/language/${course.short}/tts_edit`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const user = await getUser();

  const [language, course, language2] = await get_language(
    (await params).language,
  );

  if (!language) {
    notFound();
  }

  const speakers = await get_speakers(language.id);

  // Render data...
  return (
    <>
      <Tts_edit
        language={language}
        language2={language2}
        speakers={speakers}
        course={course}
      />
    </>
  );
}
