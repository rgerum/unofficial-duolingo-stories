import "@fontsource/nunito";
import "styles/global.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1cb0f6" />
        <title>Duostories</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
