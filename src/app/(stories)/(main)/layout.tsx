import Link from "next/link";
import React from "react";
import styles from "./layout.module.css";
import CourseDropdown from "./course-dropdown";
import styles0 from "./layout.module.css";
import FooterLinks from "./footer_links";
import Legal from "@/components/layout/legal";
import Image from "next/image";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";

export const metadata = {
  title:
    "Duostories: improve your Duolingo learning with community translated Duolingo stories.",
  description:
    "Supplement your Duolingo course with community-translated Duolingo stories.",
  alternates: {
    canonical: "https://duostories.org",
  },
  keywords: [
    "language",
    "learning",
    "stories",
    "Duolingo",
    "community",
    "volunteers",
  ],
  openGraph: {
    title: "Duostories",
    description:
      "Supplement your Duolingo course with community-translated Duolingo stories.",
    type: "website",
    url: `https://duostories.org`,
  },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={styles.all_wrapper}>
        <div className={styles.header_wrapper}>
          <nav className={styles.header_index}>
            <Link
              href={"/"}
              className={styles.duostories_title}
              data-cy={"logo"}
            >
              <Image
                src={"/Duostories.svg"}
                alt={"Duostories"}
                height={25}
                width={150}
              />
            </Link>
            <div style={{ marginLeft: "auto" }}></div>
            <CourseDropdown />
            <LoggedInButtonWrappedClient page={"stories"} course_id={"segment"} />
          </nav>
        </div>
        <main className={styles0.main_index}>{children}</main>
        <FooterLinks />
        <Legal language_name={undefined} />
      </div>
    </>
  );
}
