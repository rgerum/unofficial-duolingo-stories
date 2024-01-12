import { MDXRemote } from "next-mdx-remote/rsc";
import { GetDocsData, getPageData } from "../doc_data";
import Link from "next/link";
import styles from "../layout.module.css";
import Script from "next/script";

export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const data = await GetDocsData();

  const pages = [{}];
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
  return tag.trim().toLowerCase().replace(" ", "-");
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

  //console.log("layout", params);
  console.log("layout", path, data.navigation);

  return (
    <div className={styles.container} id="container">
      <div className={styles.blur} id="blur"></div>
      <div className={styles.navbar}>
        <div>Duostories</div>
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
  console.log("params", params.slug);
  let path = "";
  for (let p of params.slug || ["introduction"]) {
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

  let headings = [];
  for (let line of data.body.split("\n")) {
    if (line.startsWith("#")) {
      let [, count, text] = line.match("(#*)s*(.*)");
      if (count.length === 3) headings.push(text);
    }
  }

  return (
    <Layout path={path} datax={data} headings={headings}>
      <Script id="show-banner">
        {`
        function toggle(value) {
            if(value === undefined) {
                if( document.getElementById("container").getAttribute("show") == "true") {
                    value = "false";
                }
                else {
                    value = "true";
                }    
            }
            document.getElementById("container").setAttribute("show", value);
        }
        document.addEventListener("load", (event) => {console.log("add x")});
        document.addEventListener("DOMNodeInserted", (event) => {
            document.getElementById('toggle').onclick = (e) => toggle()
        });
        document.addEventListener("DOMNodeRemoved", (event) => {
            document.getElementById('toggle').onclick = (e) => toggle()
        });
        document.getElementById('toggle').onclick = (e) => toggle()
        document.getElementById('blur').onclick = (e) => toggle()
        document.getElementById('close').onclick = (e) => toggle()
        `}
      </Script>
      <header id="header" class="relative">
        <div>{data.group}</div>
        <h1>{data.title}</h1>
        <div>{data.description}</div>
      </header>
      <CustomMDX source={data.body} />
      <div className={styles.button_container}>
        <Link
          className={styles.button}
          href={`https://github.com/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}/edit/${process.env.VERCEL_GIT_COMMIT_REF}/src/app/docs${path}.mdx`}
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
    </Layout>
  );
}
