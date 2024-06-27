"use client";
import React from "react";
import get_localisation_func from "@/lib/get_localisation_func";

export const localisationContext = React.createContext();

export function useLocalisation() {
  const data = React.useContext(localisationContext);
  if (!data) return () => "";
  return get_localisation_func(data);
}

export function LocalisationProviderInner({ data, children }) {
  return (
    <localisationContext.Provider value={data}>
      {children}
    </localisationContext.Provider>
  );
}
