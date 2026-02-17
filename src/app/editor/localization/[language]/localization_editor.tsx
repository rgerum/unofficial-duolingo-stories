"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
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

function Layout({
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
      <nav className="fixed top-0 z-[1] box-border flex h-[60px] w-full items-center border-b-2 border-[var(--header-border)] bg-[var(--body-background)] px-5">
        <Breadcrumbs path={crumbs} />
        <div style={{ marginLeft: "auto" }}></div>
        <LoggedInButton page={"editor"} course_id={course?.short} />
      </nav>
      <div className="mt-[60px]">{children}</div>
    </>
  );
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
  const setLocalizationMutation = useMutation(api.localizationWrite.setLocalization);

  async function set_localization(tag: string, text: string) {
    await setLocalizationMutation({
      legacyLanguageId: language_id,
      tag,
      text,
      operationKey: `localization:${language_id}:${tag}:client`,
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
      <table className="w-full [&_td]:p-[5px] [&_td]:align-top [&_th]:bg-[var(--button-background)] [&_th]:px-2 [&_th]:py-[5px] [&_th]:text-left [&_th]:text-[var(--button-color)] [&_th:nth-child(2)]:min-w-[45%] [&_th:nth-child(3)]:min-w-[43%] [&_tr:nth-child(2n)]:bg-[var(--body-background-faint)]">
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
                <span className="whitespace-nowrap rounded-[10px] bg-[var(--editor-ssml)] px-[5px] py-[2px]">
                  {row.tag}
                </span>
              </td>
              <td className="hover:bg-[#eef8fc]">
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
