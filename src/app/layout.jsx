import React from "react";
import { Nunito } from "next/font/google";
import "styles/global.css";
import Script from "next/script";
import StyledComponentsRegistry from "@/lib/registry";
import NavigationModeProvider from "@/components/NavigationModeProvider";
import { SessionProvider } from "next-auth/react";

// If loading a variable font, you don't need to specify the font weight
const nunito = Nunito({
  subsets: ["latin-ext", "cyrillic-ext", "vietnamese"],
  variable: "--font-nunito",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={nunito.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1cb0f6" />
        <Script src="/darklight.js"></Script>
      </head>
      <body>
        <SessionProvider>
          <NavigationModeProvider>
            <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
          </NavigationModeProvider>
          {/*<AnalyticsTracker />*/}
        </SessionProvider>
      </body>
    </html>
  );
}
