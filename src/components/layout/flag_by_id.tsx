import React from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import Flag from "./flag";

export default async function FlagById({
  id,
  width,
  height,
}: {
  id: number;
  width?: number;
  height?: number;
}) {
  const language = await fetchQuery(api.localization.getLanguageFlagByLegacyId, {
    legacyLanguageId: id,
  });
  if (!language) return null;

  const { short, flag_file, flag } = language;
  return (
    <Flag
      iso={short}
      flag={flag}
      flag_file={flag_file}
      width={width}
      height={height}
    />
  );
}
