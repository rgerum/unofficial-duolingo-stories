import React from "react";
import styles from "./[language].module.css";

import { LoggedInButton } from "@/components/login/loggedinbutton";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import TextEdit from "./text_edit";

interface LanguageType {
  id: number;
  name: string;
  short: string;
}

interface CourseType {
  short?: string;
}

export default function LocalizationEditor({
  language,
  language2,
  course,
}: {
  language: LanguageType;
  language2: LanguageType | undefined;
  course: CourseType | undefined;
}) {
  // Render data...
  return (
    <>
      <Layout language_data={language} language2={language2} course={course}>
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
  course,
}: {
  children: React.ReactNode;
  language_data: LanguageType;
  language2: LanguageType | undefined;
  course: CourseType | undefined;
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
        <LoggedInButton page={"editor"} course_id={course?.short} />
      </nav>
      <div className={styles.main_index}>{children}</div>
    </>
  );
}

async function ListLocalizations({
  language_id,
  language_name,
}: {
  language_id: number;
  language_name: string;
}) {
  const data = await fetchQuery(api.editor.getLocalizations, {
    languageLegacyId: language_id,
  });

  async function set_localization(tag: string, text: string) {
    "use server";
    return fetchMutation(api.editor.setLocalization, {
      languageLegacyId: language_id,
      tag,
      text,
    });
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
