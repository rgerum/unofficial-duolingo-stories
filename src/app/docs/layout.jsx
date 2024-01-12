import styles from "./layout.module.css";
import Link from "next/link";
import { GetDocsData, getPageData } from "./doc_data";

async function PageLink({ page }) {
  const data = await getPageData(page);
  return <Link href={`/docs/${page}`}>{data.title}</Link>;
}

export default async function Layout({ children, params }) {
  const data = await GetDocsData();

  console.log("layout", params);

  return (
    <div className={styles.container} id="container">
      <div className={styles.blur} id="blur"></div>
      <div className={styles.navbar}>
        <div>Duostories</div>
      </div>
      <div className={styles.main_container}>
        <div className={styles.toc}>
          {data.navigation.map((item, i) => (
            <div key={i}>
              {item.group ? <h5>{item.group}</h5> : null}
              <ul>
                {item.pages.map((child, i) => (
                  <li key={i}>
                    <PageLink page={child} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.main}>{children}</div>
      </div>
    </div>
  );
}
