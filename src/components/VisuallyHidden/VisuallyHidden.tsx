// Uses from Josh Comeau
// https://www.joshwcomeau.com/snippets/react-components/visually-hidden/

import React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

const VisuallyHidden = ({
  children,
  className,
  ...delegated
}: VisuallyHiddenProps) => {
  const [forceShow, setForceShow] = React.useState(false);
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === "Alt") {
          setForceShow(true);
        }
      };
      const handleKeyUp = (ev: KeyboardEvent) => {
        if (ev.key === "Alt") {
          setForceShow(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, []);
  if (forceShow) {
    return <>{children}</>;
  }
  return (
    <span className={cn("sr-only", className)} {...delegated}>
      {children}
    </span>
  );
};
export default VisuallyHidden;
