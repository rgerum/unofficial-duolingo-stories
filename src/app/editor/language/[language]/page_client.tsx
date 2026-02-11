"use client";

import React from "react";
import LanguageEditor from "./language_editor";

export default function LanguageEditorPageClient({
  identifier,
}: {
  identifier: string;
}) {
  return <LanguageEditor identifier={identifier} />;
}
