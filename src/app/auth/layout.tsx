import React from "react";
import Link from "next/link";

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
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center text-[calc(19/16*1rem)]">
      <Link
        href="/"
        aria-label="Close"
        className="absolute right-5 top-5 inline-block h-[18px] w-[18px] cursor-pointer align-middle"
        style={{
          backgroundImage:
            "url(https://d35aaqx5ub95lt.cloudfront.net/images/icon-sprite8.svg)",
          backgroundPosition: "-373px -154px",
        }}
      />
      <div className="m-5 flex w-[375px] flex-col gap-2 text-center">{children}</div>
    </div>
  );
}
