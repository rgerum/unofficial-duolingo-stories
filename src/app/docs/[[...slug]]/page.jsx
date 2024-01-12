import { MDXRemote } from "next-mdx-remote/rsc";
import { GetDocsData, getPageData } from "../doc_data";
import Link from "next/link";
import styles from "../layout.module.css";
import Script from "next/script";

export default async function Page({ params }) {
  console.log("params", params.slug);
  let path = "";
  for (let p of params.slug) {
    if (p.indexOf(".") !== -1) continue;
    path += "/" + p;
  }
  let data = await getPageData(path);
  let doc_data = await GetDocsData();
  let previous = null;
  let found = false;
  let next = null;
  for (let group of doc_data.navigation) {
    for (let page of group.pages) {
      if (!next && found) next = page;
      if ("/" + page === path) {
        data.group = group.group;
        found = true;
      }
      if (!found) {
        previous = page;
      }
    }
  }
  let previousData = await getPageData("/" + previous);
  let nextData = await getPageData("/" + next);

  return (
    <>
      <div id="toggle" className={styles.short_nav}>
        <span>
          # {data.group} {">"} {data.title}
        </span>
      </div>
      <Script id="show-banner">
        {`
        function toggle() {
        if( document.getElementById("container").getAttribute("show") == "true") {
            document.getElementById("container").setAttribute("show", "false");
        }
        else {
            document.getElementById("container").setAttribute("show", "true");
        }
        }
        document.getElementById('toggle').onclick = toggle
        document.getElementById('blur').onclick = toggle
        `}
      </Script>
      <header id="header" class="relative">
        <div>{data.group}</div>
        <h1>{data.title}</h1>
        <div>{data.description}</div>
      </header>
      <MDXRemote source={data.body} />
      <div className={styles.button_container}>
        <Link
          className={styles.button}
          href={`https://github.com/rgerum/unofficial-duolingo-stories/edit/master/src/docs${path}.mdx`}
        >
          <small class="text-sm leading-4">Suggest edits</small>
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
    </>
  );
}
