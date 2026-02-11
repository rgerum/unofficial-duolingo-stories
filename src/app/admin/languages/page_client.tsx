"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import LanguageList from "./language_list";
import { Spinner } from "@/components/layout/spinner";

export default function LanguageListClient() {
  const languages = useQuery(api.adminData.getAdminLanguages, {});

  if (languages === undefined) return <Spinner />;
  return <LanguageList all_languages={languages} />;
}
