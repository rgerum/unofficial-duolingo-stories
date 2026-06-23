import React from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "@/styles/global.css";
import Script from "next/script";
import NavigationModeProvider from "@/components/NavigationModeProvider";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import PostHogUserIdentifier from "@/components/providers/PostHogUserIdentifier";

// If loading a variable font, you don't need to specify the font weight
const nunito = Nunito({
  subsets: ["latin-ext", "cyrillic-ext", "vietnamese"],
  variable: "--font-nunito",
});

function getMetadataBase() {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://duostories.org";

  try {
    return new URL(candidate);
  } catch {
    return new URL("https://duostories.org");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1cb0f6" />
        <Script id="story-js-flag" strategy="beforeInteractive">
          {`document.documentElement.setAttribute("data-story-js", "true");`}
        </Script>
        <Script src="/darklight.js"></Script>
      </head>
      <body>
        <ConvexClientProvider>
          <PostHogUserIdentifier />
          <NavigationModeProvider>{children}</NavigationModeProvider>
          {/*<AnalyticsTracker />*/}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
