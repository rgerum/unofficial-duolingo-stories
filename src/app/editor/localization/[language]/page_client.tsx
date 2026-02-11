"use client";

import React from "react";
import LocalizationEditor from "./localization_editor";

export default function LocalizationPageClient({
  identifier,
}: {
  identifier: string;
}) {
  return <LocalizationEditor identifier={identifier} />;
}
