import React from "react";
import { notFound, redirect } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface LanguageType {
  languageId: string;
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

function getCanonicalLocalizationPath(courseShort: string) {
  return `/editor/course/${courseShort}/localization`;
}

async function get_language(id: string) {
  const resolved = await fetchAuthQuery(api.editorRead.resolveEditorLanguage, {
    identifier: id,
  });
  if (!resolved?.language) return [undefined, undefined, undefined] as const;
  return [
    resolved.language as LanguageType,
    (resolved.course ?? undefined) as CourseType | undefined,
    (resolved.language2 ?? undefined) as LanguageType | undefined,
  ] as const;
}

export async function generateMetadata({ params }: PageProps) {
  let [language, course, language2] = await get_language(
    (await params).language,
  );

  if (!language) notFound();

  if (!language2) {
    return {
      title: `Localization | ${language.name} | Duostories Editor`,
      alternates: {
        canonical: `https://duostories.org${getCanonicalLocalizationPath(language.short)}`,
      },
    };
  }

  return {
    title: `Localization | ${language.name} (from ${language2.name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org${getCanonicalLocalizationPath(course?.short ?? language.short)}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  let [language, course] = await get_language((await params).language);

  if (!language) notFound();

  redirect(getCanonicalLocalizationPath(course?.short ?? language.short));
}
