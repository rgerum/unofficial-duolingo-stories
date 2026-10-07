import React from "react";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/userInterface";
import { Metadata } from "next";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

function getCanonicalVoicesEditPath(courseShort: string) {
  return `/editor/course/${courseShort}/voices/edit`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}): Promise<Metadata> {
  const resolved = await fetchAuthQuery(api.editorRead.resolveEditorLanguage, {
    identifier: (await params).language,
  });
  const language = resolved?.language;
  const course = resolved?.course;
  const language2 = resolved?.language2;

  if (!language) notFound();

  if (!language2) {
    return {
      title: `Voices Edit | ${language.name} | Duostories Editor`,
      alternates: {
        canonical: `https://duostories.org${getCanonicalVoicesEditPath(language.short)}`,
      },
    };
  }

  if (!course) notFound();

  return {
    title: `Voices Edit | ${language.name} (from ${language2.name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org${getCanonicalVoicesEditPath(course.short)}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const user = await getUser();
  void user;
  const resolved = await fetchAuthQuery(api.editorRead.resolveEditorLanguage, {
    identifier: (await params).language,
  });
  const language = resolved?.language;
  const course = resolved?.course;

  if (!language) notFound();

  redirect(getCanonicalVoicesEditPath(course?.short ?? language.short));
}
