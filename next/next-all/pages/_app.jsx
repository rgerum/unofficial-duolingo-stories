import React from "react";
import '../styles/global.css'
import { SessionProvider } from "next-auth/react"
import "@fontsource/nunito"

export default function App({
                              Component,
                              pageProps: { session, ...pageProps },
                            }) {
  return (
      <SessionProvider session={session}>
        <main>
          <Component {...pageProps} />
        </main>
      </SessionProvider>
  )
}