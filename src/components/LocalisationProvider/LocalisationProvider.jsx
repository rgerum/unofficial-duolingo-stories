"use server";
import React from "react";
import { get_localisation_dict } from "../../lib/get_localisation";
import { LocalisationProviderInner } from "./LocalisationProviderContext";

function LocalisationProvider({ lang, children }) {
  const data = React.useMemo(() => get_localisation_dict(lang), [lang]);
  return (
    <LocalisationProviderInner data={data}>
      {children}
    </LocalisationProviderInner>
  );
}

export default LocalisationProvider;
