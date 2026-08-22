"use client";

import LanguageFlag from "@/components/ui/language-flag";

export default function CourseMobileHeaderIllustration({
  learningLanguageId,
  fromLanguageId,
}: {
  learningLanguageId: string;
  fromLanguageId: string;
}) {
  return (
    <span className="relative h-7 w-8 shrink-0">
      <LanguageFlag
        languageId={learningLanguageId}
        width={24}
        className="absolute top-0 left-0"
      />
      <LanguageFlag
        languageId={fromLanguageId}
        width={21}
        className="absolute right-0 bottom-0"
      />
    </span>
  );
}
