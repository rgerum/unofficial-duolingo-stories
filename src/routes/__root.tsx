/// <reference types="vite/client" />

import type React from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import NavigationModeProvider from "@/components/NavigationModeProvider";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import PostHogUserIdentifier from "@/components/providers/PostHogUserIdentifier";
import appCss from "@/styles/global.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Unofficial Duolingo Stories",
      },
      {
        name: "theme-color",
        content: "#1cb0f6",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap",
      },
    ],
    scripts: [
      {
        src: "/darklight.js",
      },
    ],
  }),
  component: RootComponent,
  errorComponent: RootErrorBoundary,
  notFoundComponent: RootNotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* biome-ignore lint/style/noHeadElement: TanStack Start root documents render a real head element. */}
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexClientProvider>
          <PostHogUserIdentifier />
          <NavigationModeProvider>{children}</NavigationModeProvider>
        </ConvexClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootErrorBoundary({ error }: { error: Error }) {
  return (
    <RootDocument>
      <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col items-start justify-center gap-4 px-6 py-10">
        <h1 className="m-0 text-left text-[2rem] font-extrabold">
          Application error
        </h1>
        <p className="m-0 text-[var(--text-color-dim)]">
          {error.message || "The application failed to render."}
        </p>
      </main>
    </RootDocument>
  );
}

function RootNotFound() {
  return (
    <RootDocument>
      <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col items-start justify-center gap-4 px-6 py-10">
        <h1 className="m-0 text-left text-[2rem] font-extrabold">Not found</h1>
        <a className="underline underline-offset-2" href="/">
          Return home
        </a>
      </main>
    </RootDocument>
  );
}
