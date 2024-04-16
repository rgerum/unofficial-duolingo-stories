import Link from "next/link";
import styles from "./footer_links.module.css";
import React from "react";
import Image from "next/image";

export default async function FooterLinks({}) {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footer_buttons}>
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
        <div className={styles.footer_links}>
          <div>
            <h3>Social</h3>
            <ul>
              <li>
                <a href="https://discord.gg/4NGVScARR3">Discord</a>
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
          </div>
          <div>
            <h3>Contribute</h3>
            <ul>
              <li>
                <Link href="https://opencollective.com/duostories/contribute">
                  Contribute
                </Link>
              </li>
              <li>
                <a href="https://opencollective.com/duostories/donate">
                  Donate
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Legal</h3>
            <ul>
              <li>
                <Link href="/privacy_policy">Privacy Policy</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Open Source</h3>
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
          </div>
          <div>
            <h3>Apps</h3>
            <ul>
              <li>
                <Link href="https://play.google.com/store/apps/details?id=org.duostories.twa">
                  Google Play
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
