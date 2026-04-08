import React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

function getCanonicalVoicesPath(courseShort: string) {
  return `/editor/course/${courseShort}/voices`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}): Promise<Metadata> {
  const resolved = await fetchQuery(api.editorRead.resolveEditorLanguage, {
    identifier: (await params).language,
  });
  const language = resolved?.language;
  const course = resolved?.course;
  const language2 = resolved?.language2;

  if (!language) notFound();

  if (!language2) {
    return {
      title: `Voices | ${language.name} | Duostories Editor`,
      alternates: {
        canonical: `https://duostories.org${getCanonicalVoicesPath(language.short)}`,
      },
    };
  }

  if (!course) notFound();

  return {
    title: `Voices | ${language.name} (from ${language2.name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org${getCanonicalVoicesPath(course.short)}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const resolved = await fetchQuery(api.editorRead.resolveEditorLanguage, {
    identifier: (await params).language,
  });
  const language = resolved?.language;
  const course = resolved?.course;
  const language2 = resolved?.language2;

  if (!language) notFound();

  redirect(getCanonicalVoicesPath(course?.short ?? language.short));
}
