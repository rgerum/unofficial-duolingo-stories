"use server";
import React from "react";
import { get_localisation_dict } from "@/lib/get_localisation";
import { LocalisationProviderInner } from "./LocalisationProviderContext";

async function LocalisationProvider({
  lang,
  children,
}: {
  lang: number;
  children: React.ReactNode;
}) {
  const data = await get_localisation_dict(lang);
  return (
    <LocalisationProviderInner data={data}>
      {children}
    </LocalisationProviderInner>
  );
}

export default LocalisationProvider;
