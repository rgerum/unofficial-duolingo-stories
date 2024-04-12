import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { getDocsData, getPageData } from "./doc_data";
import styles from "./layout.module.css";

export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const data = await getDocsData();

  const pages = [{ slug: [] }];
  for (let group of data.navigation) {
    for (let page of group.pages) {
      pages.push({ slug: page.slug.split("/") });
    }
  }

  return pages;
}

function save_tag(tag) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

const components = {
  Info: (props) => (
    <p {...props} className={styles.box + " " + styles.info}>
      {props.children}
    </p>
  ),
  Warning: (props) => (
    <p {...props} className={styles.box + " " + styles.warning}>
      {props.children}
    </p>
  ),
  Alert: (props) => (
    <p {...props} className={styles.box + " " + styles.alert}>
      {props.children}
    </p>
  ),
  h3: (props) => (
    <h3 {...props} id={save_tag(props.children)}>
      {props.children}
    </h3>
  ),
};

function CustomMDX(props) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}

export default async function Page({ params }) {
  let path = "";
  for (let p of params.slug || ["introduction"]) {
    if (p.indexOf(".") !== -1) continue;
    path += "/" + p;
  }
  if (path.endsWith(".js") || path.endsWith(".mdx")) return notFound();

  let data = await getPageData(path);
  let doc_data = await getDocsData();
  let previous = null;
  let found = false;
  let next = null;
  for (let group of doc_data.navigation) {
    for (let page of group.pages) {
      if (!next && found) next = page.slug;
      if ("/" + page.slug === path) {
        data.group = group.group;
        found = true;
      }
      if (!found) {
        previous = page.slug;
      }
    }
  }
  let previousData = await getPageData("/" + previous);
  let nextData = await getPageData("/" + next);

  let headings = [];
  for (let line of data.body.split("\n")) {
    if (line.startsWith("#")) {
      let [, count, text] = line.match("(#*)s*(.*)");
      if (count.length === 3) headings.push(text);
    }
  }

  return (
    <>
      <div className={styles.main}>
        <header id="header">
          <div>{data.group}</div>
          <h1>{data.title}</h1>
          <div>{data.description}</div>
        </header>
        <CustomMDX source={data.body} />
        <div className={styles.button_container}>
          <Link
            className={styles.button}
            href={`https://github.com/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}/edit/${process.env.VERCEL_GIT_COMMIT_REF}/public/docs${path}.mdx`}
          >
            <small>Suggest edits</small>
          </Link>
        </div>
        <footer>
          {previous ? (
            <Link href={"/docs/" + previous}>{previousData.title}</Link>
          ) : (
            <span></span>
          )}
          {next ? (
            <Link href={"/docs/" + next}>{nextData.title}</Link>
          ) : (
            <span></span>
          )}
        </footer>
        <hr />
      </div>
      <div className={styles.toc2}>
        <div className={styles.toc2_inner}>
          {headings.map((h, i) => (
            <p key={i}>
              <a href={"#" + save_tag(h)}>{h}</a>
            </p>
          ))}
        </div>
      </div>
    </>
  );
}
