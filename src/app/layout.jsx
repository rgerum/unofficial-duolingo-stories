import { Nunito } from "next/font/google";
import "styles/global.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import StyledComponentsRegistry from "lib/registry";

// If loading a variable font, you don't need to specify the font weight
const nunito = Nunito({ subsets: ["latin-ext", "cyrillic-ext", "vietnamese"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1cb0f6" />
        <title>Duostories</title>
        <Script src="/darklight.js"></Script>
      </head>
      <body className={nunito.className}>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        {!process.env.NO_TRACK_QUERY ? <Analytics /> : null}
      </body>
    </html>
  );
}
