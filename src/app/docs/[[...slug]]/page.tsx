import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { getDocsData, getPageData } from "./doc_data";
import styles from "./layout.module.css";
import { MDXComponents } from "mdx/types";
import CustomMDXServer from "@/components/Docs/CustomMDXServer";

export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const data = await getDocsData();

  const pages = [{ slug: [] as string[] }];
  for (let group of data.navigation) {
    for (let page of group.pages) {
      pages.push({ slug: page.slug.split("/") });
    }
  }

  return pages;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const path = SlugToPath((await params).slug);
  const data = await getPageData(path);

  return {
    title: data.title + " | Duostories Docs",
    description: data.description,
  };
}

function save_tag(tag: string) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

const components: MDXComponents = {
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
  Channel: (props) => (
    <Link {...props} className={styles.channel_link}>
      {props.children}
    </Link>
  ),
  a: (props) => <Link href={props.href as string}>{props.children}</Link>,
  Image: (props) => (
    <div className={styles.image_wrapper}>{props.children}</div>
  ),
  h3: (props) => (
    <h3 {...props} id={save_tag(props.children as string)}>
      {props.children}
    </h3>
  ),
};

function CustomMDX(props: { source: string }) {
  return (
    <MDXRemote
      {...props}
      components={components} //...(props.components || {})
    />
  );
}

function SlugToPath(slug: string[]) {
  let path = "";
  for (const p of slug || ["introduction"]) {
    if (p.indexOf(".") !== -1) continue;
    path += "/" + p;
  }
  if (path.endsWith(".js") || path.endsWith(".mdx")) return notFound();
  return path;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

function getHeadings(title: string, body: string) {
  const headings: Heading[] = [{ id: save_tag(title), level: 1, text: title }];
  for (const line of body.split("\n")) {
    if (line.startsWith("#")) {
      const [, count, text] = line.match("(#*)s*(.*)") || ["", "####", ""];
      headings.push({ id: save_tag(text), level: count.length, text: text });
    }
  }
  return headings;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const path = SlugToPath((await params).slug);
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

  const headings = getHeadings(data.title, data.body);

  return (
    <>
      <div className={styles.main}>
        <header id="header" className="mb-7 max-[640px]:mb-5">
          <div className="mb-2 text-[0.95rem] font-bold tracking-[0.01em] text-gray-500">
            {data.group}
          </div>
          <h1 className="m-0">{data.title}</h1>
          <p className="mt-2.5 mb-0 max-w-[70ch] text-gray-600 max-[640px]:mt-2">
            {data.description}
          </p>
        </header>
        <CustomMDXServer source={data.body} />
        {/*<CustomMDX source={data.body} />*/}
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
              <a href={"#" + save_tag(h.text)}>{h.text}</a>
            </p>
          ))}
        </div>
      </div>
    </>
  );
}
