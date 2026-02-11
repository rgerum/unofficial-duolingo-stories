"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/layout/spinner";
import Tts_edit from "./tts_edit";
import type { CourseStudType, LanguageType, SpeakersType } from "../types";

export default function LanguageTtsEditorPageClient({
  identifier,
}: {
  identifier: string;
}) {
  const resolved = useQuery(api.editorRead.resolveEditorLanguage, {
    identifier,
  });

  const speakers = useQuery(
    api.editorRead.getEditorSpeakersByLanguageLegacyId,
    resolved?.language ? { languageLegacyId: resolved.language.id } : "skip",
  );

  if (resolved === undefined || speakers === undefined) {
    return <Spinner />;
  }

  if (!resolved?.language) {
    return <p>Language not found.</p>;
  }

  return (
    <Tts_edit
      language={resolved.language as LanguageType}
      language2={(resolved.language2 ?? undefined) as LanguageType | undefined}
      speakers={(speakers ?? []) as SpeakersType[]}
      course={(resolved.course ?? undefined) as CourseStudType | undefined}
    />
  );
}

