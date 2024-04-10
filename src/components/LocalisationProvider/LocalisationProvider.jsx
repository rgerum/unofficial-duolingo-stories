import React from "react";
import { get_localisation_dict } from "../../lib/get_localisation";

function LocalisationProvider({ lang, children }) {
  const data = React.useMemo(() => get_localisation_dict(lang), [lang]);
  return (
    <localisationContext.Provider value={data}>
      {children}
    </localisationContext.Provider>
  );
}

export default LocalisationProvider;
