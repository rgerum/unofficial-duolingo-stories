import Link from "next/link";
import Script from "next/script";
import { MDXRemote } from "next-mdx-remote/rsc";
import { GetDocsData, getPageData } from "./doc_data";
import styles from "./layout.module.css";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const data = await GetDocsData();

  const pages = [{ slug: [] }];
  for (let group of data.navigation) {
    for (let page of group.pages) {
      pages.push({ slug: page.split("/") });
    }
  }

  return pages;
}

async function PageLink({ page, active }) {
  const data = await getPageData(page);
  if (active) return <span className={styles.active}>{data.title}</span>;
  return (
    <Link href={`/docs/${page}`} className={active ? styles.active : undefined}>
      <span>{data.title}</span>
    </Link>
  );
}

function save_tag(tag) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

const components = {
  Info: (props) => (
    <p {...props} className={styles.info}>
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

async function Layout({ children, path, datax, headings }) {
  const data = await GetDocsData();

  return (
    <div className={styles.container} id="container">
      <div className={styles.blur} id="blur"></div>
      <div className={styles.blur2} id="blur2"></div>
      <div className={styles.search_modal} id="search_modal">
        <div>
          <input
            id="search_input"
            placeholder=" Search Documentation..."
          ></input>
          <button>Esc</button>
        </div>
        <div id="search_results"></div>
      </div>
      <div className={styles.navbar}>
        <div>
          <Link href="/">Duostories</Link>
        </div>
        <button id="search" className={styles.search}>
          <span>
            <span>Search Documentation...</span>
          </span>
          <span>CtrlK</span>
        </button>
      </div>
      <div className={styles.short_nav}>
        <svg
          id="toggle"
          width="30"
          height="30"
          version="1.1"
          viewBox="0 0 3.175 3.175"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            fill="none"
            stroke="#000"
            strokeLinecap="square"
            strokeWidth=".28222"
          >
            <path d="m0.80839 0.88828h1.5582" />
            <path d="m0.80839 1.5875h1.5582" />
            <path d="m0.80839 2.2867h1.5582" />
          </g>
        </svg>
        <span>
          {datax.group ? `${datax.group} › ` : null} <b>{datax.title}</b>
        </span>
      </div>
      <div className={styles.main_container}>
        <div className={styles.toc} id="toc">
          <button className={styles.close} id="close">
            ×
          </button>
          {data.navigation.map((item, i) => (
            <div key={i}>
              {item.group ? <h5>{item.group}</h5> : null}
              <ul>
                {item.pages.map((child, i) => (
                  <li key={i}>
                    <PageLink page={child} active={"/" + child === path} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.main}>{children}</div>
        <div className={styles.toc2}>
          {headings.map((h, i) => (
            <p key={i}>
              <a href={"#" + save_tag(h)}>{h}</a>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Page({ params }) {
  let path = "";
  for (let p of params.slug || ["introduction"]) {
    if (p.indexOf(".") !== -1) continue;
    path += "/" + p;
  }
  if (path.endsWith(".js") || path.endsWith(".mdx")) return notFound();
  console.log(path);
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

  let headings = [];
  for (let line of data.body.split("\n")) {
    if (line.startsWith("#")) {
      let [, count, text] = line.match("(#*)s*(.*)");
      if (count.length === 3) headings.push(text);
    }
  }

  return (
    <Layout path={path} datax={data} headings={headings}>
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
      <Script src="/docs/search.js"></Script>
    </Layout>
  );
}
