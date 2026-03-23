import Link from "next/link";
import React from "react";

export default async function FooterLinks({}) {
  return (
    <>
      <footer className="mt-auto">
        <div className="mx-auto mt-[50px] flex w-full max-w-[1000px] justify-end px-4">
          <Link
            href="https://opencollective.com/duostories/contribute"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-[999px] border-[var(--button-blue-border)] border-b-4 border-l-2 border-r-2 border-t-2 bg-[var(--button-blue-background)] px-6 py-2 text-[calc(14/16*1rem)] font-bold uppercase tracking-[0.12em] text-[var(--button-blue-color)] no-underline transition-[filter] duration-100 hover:brightness-110"
          >
            Contribute to our collective
          </Link>
        </div>
        <div className="mt-5 mb-3 border-t-2 border-[var(--overview-hr)]" />
        <div className="mx-auto mb-5 grid w-full max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] justify-around px-4 text-[calc(16/16*1rem)] opacity-60 [&_figcaption]:mb-0 [&_figcaption]:font-bold [&_li]:list-none [&_li]:before:content-['•_'] [&_ul]:m-0 [&_ul]:pl-0 [@media(pointer:coarse)]:[&_li_a]:leading-[calc(48/16*1rem)]">
          <figure>
            <figcaption>Social</figcaption>
            <nav>
              <ul>
                <li>
                  <Link href="https://discord.gg/4NGVScARR3">Discord</Link>
                </li>
                <li>
                  <Link href="https://twitter.com/DuostoriesNews">Twitter</Link>
                </li>
                <li>
                  <Link href="https://www.instagram.com/duostoriesproject/">
                    Instagram
                  </Link>
                </li>
              </ul>
            </nav>
          </figure>
          <figure>
            <figcaption>Contribute</figcaption>
            <nav>
              <ul>
                <li>
                  <Link href="https://opencollective.com/duostories/contribute">
                    Contribute
                  </Link>
                </li>
                <li>
                  <Link href="/docs">Docs</Link>
                </li>
              </ul>
            </nav>
          </figure>
          <figure>
            <figcaption>Legal</figcaption>
            <nav>
              <ul>
                <li>
                  <Link href="/privacy_policy">Privacy Policy</Link>
                </li>
              </ul>
            </nav>
          </figure>
          <figure>
            <figcaption>Open Source</figcaption>
            <nav>
              <ul>
                <li>
                  <Link href="https://github.com/rgerum/unofficial-duolingo-stories">
                    Github Code
                  </Link>
                </li>
                <li>
                  <Link href="https://github.com/rgerum/unofficial-duolingo-stories-content">
                    Github Content
                  </Link>
                </li>
              </ul>
            </nav>
          </figure>
          <figure>
            <figcaption>Apps</figcaption>
            <nav>
              <ul>
                <li>
                  <Link href="https://play.google.com/store/apps/details?id=org.duostories.twa">
                    Google Play
                  </Link>
                </li>
              </ul>
            </nav>
          </figure>
        </div>
      </footer>
    </>
  );
}
