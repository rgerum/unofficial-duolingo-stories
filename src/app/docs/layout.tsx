import DocsHeader from "@/components/DocsHeader";
import DocsBreadCrumbNav from "@/components/DocsBreadCrumbNav";
import DocsNavigation from "@/components/DocsNavigation";
import React from "react";
import {
  getDocsData,
  getDocsSearchIndex,
  getPageData,
} from "./[[...slug]]/doc_data";
import DocsNavigationBackdrop from "@/components/DocsNavigationBackdrop";
import {
  docsMainContainerClass,
  docsRootClass,
} from "@/components/Docs/docsClasses";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getDocsData();
  const searchIndex = await getDocsSearchIndex();

  const path_titles: Record<string, { group: string; title: string }> = {};
  for (let group of data.navigation) {
    for (let page of group.pages) {
      const datax = await getPageData(page.slug);
      path_titles[page.slug] = {
        group: group.group,
        title: datax.title,
      };
    }
  }

  return (
    <div className={docsRootClass} id="container">
      <DocsNavigationBackdrop>
        <DocsHeader searchIndex={searchIndex} />
        <DocsBreadCrumbNav path_titles={path_titles} />

        <div className={docsMainContainerClass}>
          <DocsNavigation data={data} />
          {children}
        </div>
      </DocsNavigationBackdrop>
    </div>
  );
}
