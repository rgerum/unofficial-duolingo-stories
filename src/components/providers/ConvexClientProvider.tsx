"use client";

import React from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convex = React.useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl],
  );

  if (!convex) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "ConvexClientProvider: NEXT_PUBLIC_CONVEX_URL is not set. Auth will be disabled.",
      );
    }
    return <>{children}</>;
  }

  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
