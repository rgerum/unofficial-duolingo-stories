import React from "react";
import '../styles/global.css'
//import font from "../lib/font";
//className={font.className}
import { SessionProvider } from "next-auth/react"

export default function App({
                              Component,
                              pageProps: { session, ...pageProps },
                            }) {
  return (
      <SessionProvider session={session}>
        <main >
          <Component {...pageProps} />
        </main>
      </SessionProvider>
  )
}