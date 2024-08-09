import React from "react";
import styles from "./[language].module.css";

import LoggedInButton, { LogInButton } from "@/components/login/loggedinbutton";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { sql } from "@/lib/db";
import TextEdit from "./text_edit";

export default function LocalizationEditor({
  language,
  language2,
  session,
  course,
}) {
  // Render data...
  return (
    <>
      <Layout
        language_data={language}
        language2={language2}
        session={session}
        course={course}
      >
        <ListLocalizations
          language_id={language2?.id || language.id}
          language_name={language2?.name || language.name}
        ></ListLocalizations>
      </Layout>
    </>
  );
}

export function Layout({
  children,
  language_data,
  language2,
  session,
  course,
}) {
  let crumbs = [
    { type: "Editor", href: `/editor` },
    { type: "sep" },
    {
      type: "course",
      lang1: language_data,
      lang2: language2,
      href: course?.short ? `/editor/course/${course?.short}` : `/editor`,
    },
    { type: "sep" },
    { type: "Localization" },
  ];
  return (
    <>
      <nav className={styles.header_index}>
        <Breadcrumbs path={crumbs} />
        <div style={{ marginLeft: "auto" }}></div>
        {session?.user ? (
          <LoggedInButton
            page={"editor"}
            course_id={course?.short}
            session={session}
          />
        ) : (
          <LogInButton />
        )}
      </nav>
      <div className={styles.main_index}>{children}</div>
    </>
  );
} //                 <Login page={"editor"}/>

async function ListLocalizations({ language_id, language_name }) {
  let data = await sql`SELECT l.tag, l.text AS text_en, l2.text
FROM localization l
LEFT JOIN localization l2 ON l.tag = l2.tag AND l2.language_id = ${language_id}
WHERE l.language_id = 1;`;

  async function set_localization(tag, text) {
    "use server";
    return sql`INSERT INTO localization (tag, text, language_id)
    VALUES (${tag}, ${text}, ${language_id})
    ON CONFLICT (tag, language_id)
    DO UPDATE SET text = EXCLUDED.text`;
  }

  return (
    <div>
      <h1>Localizations {language_name}</h1>
      <p>
        If your course does not have English as a base language, you can adjust
        the texts of the Duostories interface to match the base language of your
        course. If multiple courses share the same base language, these texts
        only need to be translated once.
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tag</th>
            <th>Text</th>
            <th>Text EN</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l) => (
            <tr key={l.tag}>
              <td>
                <span className={styles.tag}>{l.tag}</span>
              </td>
              <td className={styles.edit_td}>
                <TextEdit
                  tag={l.tag}
                  text={l.text}
                  set_localization={set_localization}
                />
              </td>
              <td>{l.text_en}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
