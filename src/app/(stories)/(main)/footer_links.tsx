import Link from "next/link";
import React from "react";
import Image from "next/image";

export default async function FooterLinks({}) {
  return (
    <>
      <footer className="mt-auto">
        <div className="mt-[50px] flex justify-end px-[10px]">
          <Link
            href="https://opencollective.com/duostories/contribute"
            target="_blank"
          >
            <Image
              src="https://opencollective.com/duostories/contribute/button@2x.png?color=blue"
              height="48"
              width="334"
              alt={"Contribute to our collective"}
            />
          </Link>
        </div>
        <div className="mb-[50px] grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] justify-around border-t-2 border-[var(--overview-hr)] text-[calc(16/16*1rem)] opacity-60 [&_figcaption]:mb-0 [&_figcaption]:font-bold [&_li]:list-none [&_li]:before:content-['•_'] [&_ul]:m-0 [&_ul]:pl-0 [@media(pointer:coarse)]:[&_li_a]:leading-[calc(48/16*1rem)]">
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
                  <Link href="https://opencollective.com/duostories/donate">
                    Donate
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
