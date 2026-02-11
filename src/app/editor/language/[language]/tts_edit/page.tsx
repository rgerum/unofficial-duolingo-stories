import React from "react";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/userInterface";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import LanguageTtsEditorPageClient from "./page_client";

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
  void user;
  return <LanguageTtsEditorPageClient identifier={(await params).language} />;
}
