"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/layout/spinner";
import styles from "./[language].module.css";
import { LoggedInButton } from "@/components/login/loggedinbutton";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import TextEdit from "./text_edit";

type LanguageType = {
  id: number;
  name: string;
  short: string;
};

type CourseType = {
  short?: string;
};

type LocalizationRow = {
  tag: string;
  text_en: string;
  text: string | null;
};

export default function LocalizationEditor({
  identifier,
}: {
  identifier: string;
}) {
  const resolved = useQuery(api.editorRead.resolveEditorLanguage, {
    identifier,
  });

  const localizationRows = useQuery(
    api.editorRead.getEditorLocalizationRowsByLanguageLegacyId,
    resolved?.language
      ? {
          languageLegacyId: resolved.language2?.id ?? resolved.language.id,
        }
      : "skip",
  );

  if (resolved === undefined || localizationRows === undefined) {
    return <Spinner />;
  }

  if (!resolved?.language) {
    return <p>Language not found.</p>;
  }

  const language = resolved.language as LanguageType;
  const language2 = (resolved.language2 ?? undefined) as LanguageType | undefined;
  const course = (resolved.course ?? undefined) as CourseType | undefined;

  return (
    <Layout language_data={language} language2={language2} course={course}>
      <ListLocalizations
        language_id={language2?.id || language.id}
        language_name={language2?.name || language.name}
        rows={localizationRows as LocalizationRow[]}
      />
    </Layout>
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
  const crumbs = [
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

async function setLocalization({
  tag,
  text,
  language_id,
}: {
  tag: string;
  text: string;
  language_id: number;
}) {
  const response = await fetch("/editor/localization/set", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ tag, text, language_id }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

function ListLocalizations({
  language_id,
  language_name,
  rows,
}: {
  language_id: number;
  language_name: string;
  rows: LocalizationRow[];
}) {
  async function set_localization(tag: string, text: string) {
    await setLocalization({ tag, text, language_id });
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
          {rows.map((row) => (
            <tr key={row.tag}>
              <td>
                <span className={styles.tag}>{row.tag}</span>
              </td>
              <td className={styles.edit_td}>
                <TextEdit
                  tag={row.tag}
                  text={row.text}
                  set_localization={set_localization}
                />
              </td>
              <td>{row.text_en}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
