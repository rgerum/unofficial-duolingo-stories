"use client";
import React from "react";
import get_localisation_func from "@/lib/get_localisation_func";

const localisationContext = React.createContext({} as Record<string, string>);

export function useLocalisation() {
  const data = React.useContext(localisationContext);
  if (!data) return () => "";
  return get_localisation_func(data);
}

export function LocalisationProviderInner({
  data,
  children,
}: {
  data: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <localisationContext.Provider value={data}>
      {children}
    </localisationContext.Provider>
  );
}
