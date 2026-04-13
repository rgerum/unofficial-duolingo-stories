import Link from "@/lib/router";
import React from "react";
import CourseDropdown from "./course-dropdown";
import FooterLinks from "./footer_links";
import Legal from "@/components/layout/legal";
import Image from "@/lib/image";
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

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate mx-auto flex min-h-full w-full flex-col">
      <div className="sticky top-0 z-[1] w-full bg-[var(--body-background)] after:absolute after:left-1/2 after:w-full after:-translate-x-1/2 after:border-b-2 after:border-[var(--header-border)] after:content-['']">
        <nav className="mx-auto flex max-w-[1000px] items-center px-5 py-1.5">
          <Link
            href="/"
            className="block text-[29px] font-bold text-[var(--duostories-title)] no-underline"
            data-cy="logo"
          >
            <Image
              src="/Duostories.svg"
              alt="Duostories"
              height={25}
              width={150}
            />
          </Link>
          <div className="ml-auto" />
          <CourseDropdown />
          <LoggedInButtonWrappedClient page={"stories"} course_id={"segment"} />
        </nav>
      </div>
      <main className="isolate flex flex-col max-w-[1000px] w-full mx-auto px-4">
        {children}
      </main>
      <FooterLinks />
      <Legal language_name={undefined} />
    </div>
  );
}
