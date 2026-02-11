import React from "react";
import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import LocalizationPageClient from "./page_client";

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

const get_language = cache(async (id: string) => {
  const resolved = await fetchQuery(api.editorRead.resolveEditorLanguage, {
    identifier: id,
  });
  if (!resolved?.language) return [undefined, undefined, undefined] as const;
  return [
    resolved.language as LanguageType,
    (resolved.course ?? undefined) as CourseType | undefined,
    (resolved.language2 ?? undefined) as LanguageType | undefined,
  ] as const;
});

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
  return <LocalizationPageClient identifier={(await params).language} />;
}
