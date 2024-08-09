"use client";
import React from "react";
import { usePathname } from "next/navigation";

export const navigationModeContext = React.createContext();

export function useNavigationMode() {
  return React.useContext(navigationModeContext).type;
}

export default function NavigationModeProvider({ children }) {
  const [type, setType] = React.useState("hard");
  const initialRender = React.useRef(true);
  const pathname = usePathname();
  React.useEffect(() => {
    if (!initialRender.current) {
      setType("soft");
    } else {
      setType("hard");
      initialRender.current = false;
    }
  }, [pathname]);
  return (
    <navigationModeContext.Provider value={{ type }}>
      {children}
    </navigationModeContext.Provider>
  );
}
