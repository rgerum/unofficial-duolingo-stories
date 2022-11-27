import React from "react";
import '../styles/global.css'
import font from "../lib/font";

export default function App({ Component, pageProps }) {
  return <React.StrictMode><main className={font.className}><Component {...pageProps} /></main></React.StrictMode>
}
