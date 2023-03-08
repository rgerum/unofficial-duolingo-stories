import React from "react";
import '../styles/global.css'
import { SessionProvider } from "next-auth/react"

import { Nunito } from '@next/font/google'

// If loading a variable font, you don't need to specify the font weight
const nunito = Nunito({ subsets: ['latin-ext', 'cyrillic-ext', "vietnamese", ] })


export default function App({
                              Component,
                              pageProps: { session, ...pageProps },
                            }) {
  return (
      <SessionProvider session={session}>
        <main className={nunito.className}>
          <Component {...pageProps} />
        </main>
      </SessionProvider>
  )
}