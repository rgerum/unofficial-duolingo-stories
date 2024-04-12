import styles from "./[[...slug]]/layout.module.css";
import DocsHeader from "../../components/DocsHeader";
import DocsBreadCrumbNav from "../../components/DocsBreadCrumbNav";
import DocsNavigation from "../../components/DocsNavigation";
import React from "react";
import { getDocsData, getPageData } from "./[[...slug]]/doc_data";
import DocsNavigationBackdrop from "../../components/DocsNavigationBackdrop";

export default async function Layout({ children }) {
  const data = await getDocsData();

  const path_titles = {};
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
    <div className={styles.container} id="container">
      <DocsNavigationBackdrop>
        <DocsHeader />
        <DocsBreadCrumbNav data={data} path_titles={path_titles} />

        <div className={styles.main_container}>
          <DocsNavigation data={data} />
          {children}
        </div>
      </DocsNavigationBackdrop>
    </div>
  );
}
