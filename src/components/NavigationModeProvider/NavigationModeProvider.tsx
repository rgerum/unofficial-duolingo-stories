"use client";
import React from "react";
import { usePathname } from "next/navigation";

const navigationModeContext = React.createContext({
  type: "hard" as "hard" | "soft",
});

export function useNavigationMode() {
  return React.useContext(navigationModeContext).type;
}

// usePathname() suspends while prerendering routes with dynamic params, so it
// lives in its own Suspense leaf instead of blocking the whole app shell.
function PathnameChangeWatcher({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const initialPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (pathname !== initialPathname.current) onChange();
  }, [pathname, onChange]);
  return null;
}

export default function NavigationModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [type, setType] = React.useState<"hard" | "soft">("hard");
  const markSoft = React.useCallback(() => setType("soft"), []);
  return (
    <navigationModeContext.Provider value={{ type }}>
      <React.Suspense fallback={null}>
        <PathnameChangeWatcher onChange={markSoft} />
      </React.Suspense>
      {children}
    </navigationModeContext.Provider>
  );
}
