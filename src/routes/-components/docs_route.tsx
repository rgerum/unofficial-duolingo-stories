import type React from "react";
import DocsBreadCrumbNav from "@/components/DocsBreadCrumbNav";
import DocsHeader from "@/components/DocsHeader";
import DocsNavigation from "@/components/DocsNavigation";
import DocsNavigationBackdrop from "@/components/DocsNavigationBackdrop";
import {
  docsFooterClass,
  docsFooterLinkClass,
  docsHeaderIntroClass,
  docsMainContainerClass,
  docsPageMainClass,
  docsRightTocClass,
  docsRightTocInnerClass,
  docsRootClass,
} from "@/components/Docs/docsClasses";
import Link from "@/lib/router";

export type DocsPageData = {
  description?: string;
  group: string;
  navigation: {
    group: string;
    pages: { slug: string; title: string }[];
  }[];
  next?: { slug: string; title: string } | null;
  pathTitles: Record<string, { group: string; title: string }>;
  previous?: { slug: string; title: string } | null;
  slug: string;
  title: string;
  body: string;
};

function renderBody(body: string) {
  return body
    .split("\n\n")
    .filter(Boolean)
    .map((block, index) => (
      <p key={index} className="mb-4 whitespace-pre-wrap">
        {block}
      </p>
    ));
}

export function DocsRoutePage({ data }: { data: DocsPageData }) {
  return (
    <div className={docsRootClass} id="container">
      <DocsNavigationBackdrop>
        <DocsHeader />
        <DocsBreadCrumbNav path_titles={data.pathTitles} />
        <div className={docsMainContainerClass}>
          <DocsNavigation data={{ navigation: data.navigation }} />
          <div className={docsPageMainClass}>
            <header id="header" className={docsHeaderIntroClass}>
              <div className="mb-2 text-[0.95rem] font-bold tracking-[0.01em] text-gray-500">
                {data.group}
              </div>
              <h1 className="m-0">{data.title}</h1>
              <p className="mt-2.5 mb-0 max-w-[70ch] text-gray-600 max-[640px]:mt-2">
                {data.description}
              </p>
            </header>
            <article className="py-4 text-[1rem] leading-[1.7]">
              {renderBody(data.body)}
            </article>
            <footer className={docsFooterClass}>
              {data.previous ? (
                <Link
                  className={docsFooterLinkClass}
                  href={`/docs/${data.previous.slug}`}
                >
                  <span className="mr-[10px]">‹</span>
                  {data.previous.title}
                </Link>
              ) : (
                <span />
              )}
              {data.next ? (
                <Link
                  className={docsFooterLinkClass}
                  href={`/docs/${data.next.slug}`}
                >
                  {data.next.title}
                  <span className="ml-[10px]">›</span>
                </Link>
              ) : (
                <span />
              )}
            </footer>
          </div>
          <div className={docsRightTocClass}>
            <div className={docsRightTocInnerClass}>
              <p>{data.title}</p>
            </div>
          </div>
        </div>
      </DocsNavigationBackdrop>
    </div>
  );
}
