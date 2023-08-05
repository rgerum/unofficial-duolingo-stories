import React from "react";
import Link from "next/link";
import styles from "./register.module.css"

export const metadata = {
    title: 'Duostories: improve your Duolingo learning with community translated Duolingo stories.',
    description: 'Supplement your Duolingo course with community-translated Duolingo stories.',
    alternates: {
        canonical: 'https://duostories.org',
    },
    keywords: ['language', 'learning', 'stories', 'Duolingo', 'community', 'volunteers'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className={styles.login_dialog}>
          <Link href="/" className={styles.quit}></Link>
          <div>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
