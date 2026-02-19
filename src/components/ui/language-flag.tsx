"use client";

import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo, type ComponentProps } from "react";
import Flag from "./flag";

type FlagProps = ComponentProps<typeof Flag>;

type LanguageFlagEntry = {
  languageId: Id<"languages">;
  short: string;
  flag?: number;
  flag_file?: string;
};

export function useLanguageFlag(languageId?: Id<"languages">) {
  const languageFlags = useQuery(api.localization.getAllLanguageFlags, {});
  if (!languageId || !languageFlags) return undefined;

  const languageFlagMap = useMemo(() => {
    const map = new Map<Id<"languages">, LanguageFlagEntry>();
    for (const language of languageFlags as LanguageFlagEntry[]) {
      map.set(language.languageId, language);
    }
    return map;
  }, [languageFlags]);

  return languageFlagMap.get(languageId);
}

export default function LanguageFlag({
  languageId,
  ...props
}: {
  languageId?: Id<"languages"> | string;
} & Omit<FlagProps, "iso" | "flag" | "flag_file">) {
  const language = useLanguageFlag(languageId as Id<"languages"> | undefined);

  return (
    <Flag
      {...props}
      iso={language?.short}
      flag={language?.flag}
      flag_file={language?.flag_file ?? undefined}
    />
  );
}
