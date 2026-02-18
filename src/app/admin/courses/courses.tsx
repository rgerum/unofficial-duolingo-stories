"use client";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import Flag from "@/components/ui/flag";
import * as EditDialog from "../edit_dialog";
import React, { useState } from "react";
import styled from "styled-components";
import Button from "@/components/ui/button";
import Tag from "@/components/ui/badge";
import Input from "@/components/ui/input";
import FlagName from "../FlagName";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

interface CourseProps {
  id: number;
  learning_language: number;
  from_language: number;
  public: boolean;
  official: boolean;
  name: string | null;
  about: string | null;
  conlang: boolean;
  short: string | null;
  tags: string[];
}

interface AdminLanguageProps {
  id: number;
  name: string;
  short: string;
  flag: number;
  flag_file: string;
  speaker: string;
  default_text: string;
  tts_replace: string;
  public: boolean;
  rtl: boolean;
}

const statusYesClass =
  "inline-block min-w-[38px] rounded-full bg-[color:color-mix(in_srgb,#21c55d_22%,transparent)] px-2.5 py-0.5 text-center text-[0.82rem] font-bold text-[#0a6b2d]";
const statusNoClass =
  "inline-block min-w-[38px] rounded-full bg-[color:color-mix(in_srgb,#ef4444_20%,transparent)] px-2.5 py-0.5 text-center text-[0.82rem] font-bold text-[#9b1c1c]";

function InputLanguage({
  name,
  label,
  value,
  setValue,
  languages,
}: {
  name: string;
  label: string;
  value: number;
  setValue: (value: number) => void;
  languages: Record<number, AdminLanguageProps>;
}) {
  const [nameX, setName] = useState(languages[value]?.name || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  let valid = false;
  for (const lang in languages) {
    if (languages[lang].name.toLowerCase() === nameX.toLowerCase()) {
      valid = true;
      break;
    }
  }
  const edited = function (e: React.ChangeEvent<HTMLInputElement> | string) {
    let value = typeof e == "string" ? e : e.target?.value;
    for (const lang in languages) {
      if (
        value?.toLowerCase &&
        languages[lang].name.toLowerCase() === value.toLowerCase()
      ) {
        setValue(parseInt(lang));
        //props.callback(props.name, lang);
        break;
      }
    }
    setName(value);
  };

  const language_id: number[] = [];
  for (const key in languages) {
    const lang = Number(key);
    if (languages[lang].name.toLowerCase().indexOf(nameX.toLowerCase()) !== -1)
      language_id.push(lang);
  }
  return (
    <EditDialog.Fieldset>
      <EditDialog.Label className="Label" htmlFor={label}>
        {name}
      </EditDialog.Label>
      <LangDrowdown>
        <LangItemMain>
          {valid ? (
            <Flag
              iso={languages[value].short}
              width={40}
              flag={languages[value].flag}
              flag_file={languages[value].flag_file}
            />
          ) : (
            <Flag width={40} flag={-2736} />
          )}
          <LangInput
            ref={inputRef}
            id={label}
            value={nameX}
            onChange={edited}
          />
          <LangDropdownContent>
            {language_id.map((lang) => (
              <LangItemButton
                key={languages[lang].id}
                onClick={() => {
                  edited(languages[lang].name);
                }}
              >
                <Flag
                  iso={languages[lang].short}
                  width={40}
                  flag={languages[lang].flag}
                  flag_file={languages[lang].flag_file}
                />
                <div>{languages[lang].name}</div>
              </LangItemButton>
            ))}
          </LangDropdownContent>
        </LangItemMain>
      </LangDrowdown>
    </EditDialog.Fieldset>
  );
}

const LangDrowdown = styled.div`
  flex: 1;
`;

const LangDropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #f1f1f1;
  min-width: 160px;
  box-shadow: 0 8px 16px #0003;
  z-index: 1;

  width: 100%;
  top: 43px;
  left: 0;

  ${LangDrowdown}:focus-within & {
    display: block;
    max-height: 180px;
    overflow: scroll;
  }

  & button {
    width: 100%;
    border: none;
  }
`;

const LangItemButton = styled.button`
  display: flex;
  align-items: center;
  border: none;
  background: var(--body-background);
  padding: 0;
  outline-offset: -2px;

  & img {
    margin: 4px 8px 4px 0;
  }
`;

const LangItemMain = styled.div`
  display: flex;
  align-items: baseline;
  position: relative;
  padding-left: calc(38px + 8px);

  & > img {
    position: absolute;
    top: 0;
    left: -2px;
    bottom: 0;
    margin: auto;
  }
`;

const LangInput = styled(EditDialog.Input)`
  width: 100%;
`;

function EditCourse({
  obj,
  languages,
  updateCourse,
  is_new,
}: {
  obj: CourseProps;
  languages: Record<number, AdminLanguageProps>;
  updateCourse: (course: CourseProps) => void;
  is_new: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const createCourseMutation = useMutation(api.adminWrite.createAdminCourse);
  const updateCourseMutation = useMutation(api.adminWrite.updateAdminCourse);

  const [short, setShort] = useState(obj.short || "");
  const [fromLanguage, setFromLanguage] = useState(obj.from_language || 0);
  const [learningLanguage, setLearningLanguage] = useState(
    obj.learning_language || 0,
  );

  const [name, setName] = useState(obj.name || "");
  const [published, setPublished] = useState(obj.public || false);
  const [conlang, setConlang] = useState(obj.conlang || false);
  const [tags, setTags] = useState<string[]>(obj.tags || []);
  const [about, setAbout] = useState(obj.about || "");

  async function Send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tagList = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);

    const data = {
      id: obj.id,
      from_language: fromLanguage,
      learning_language: learningLanguage,
      name: name,
      public: published,
      conlang: conlang,
      tags: tagList,
      about: about,
    };
    //console.log("send", data);

    try {
      let new_data;
      if (is_new) {
        new_data = await createCourseMutation({
          learning_language: data.learning_language,
          from_language: data.from_language,
          public: data.public,
          name: data.name,
          conlang: data.conlang,
          tags: data.tags,
          about: data.about,
          operationKey: `course:create:${data.learning_language}:${data.from_language}:client`,
        });
      } else {
        new_data = await updateCourseMutation({
          id: data.id,
          learning_language: data.learning_language,
          from_language: data.from_language,
          public: data.public,
          name: data.name,
          conlang: data.conlang,
          tags: data.tags,
          about: data.about,
          operationKey: `course:${data.id}:admin_set:client`,
        });
      }
      //console.log("new_data", new_data);
      setOpen(false);
      updateCourse(new_data);
    } catch (e) {
      //console.log("error", e);
      setError("An error occurred. Please report in Discord.");
    }
  }

  return (
    <EditDialog.Root open={open} onOpenChange={setOpen}>
      <EditDialog.Trigger asChild>
        <Button style={{ marginLeft: "auto" }}>
          {is_new ? "Add" : "Edit"}
        </Button>
      </EditDialog.Trigger>
      <EditDialog.Content>
        <EditDialog.DialogTitle>
          {is_new ? "Add" : "Edit"} course
        </EditDialog.DialogTitle>
        <EditDialog.DialogDescription>
          {is_new
            ? "Add a new course. Click save when you're done."
            : "Make changes to a course. Click save when you're done."}
        </EditDialog.DialogDescription>
        <form onSubmit={Send}>
          <EditDialog.InputText
            name={"Name"}
            label={"name"}
            value={name}
            setValue={setName}
          />
          <EditDialog.InputText
            name={"Short"}
            label={"short"}
            value={short}
            setValue={setShort}
          />
          <InputLanguage
            name={"From language"}
            label={"from_language"}
            value={fromLanguage}
            setValue={setFromLanguage}
            languages={languages}
          />
          <InputLanguage
            name={"Learning Language"}
            label={"learning_language"}
            value={learningLanguage}
            setValue={setLearningLanguage}
            languages={languages}
          />
          <EditDialog.InputBool
            name={"Public"}
            label={"public"}
            value={published}
            setValue={setPublished}
          />
          <EditDialog.InputBool
            name={"Conlang"}
            label={"conlang"}
            value={conlang}
            setValue={setConlang}
          />
          <EditDialog.InputText
            name={"Tags"}
            label={"tags"}
            value={tags.join(",")}
            setValue={(t) => setTags(t.split(",").map((t) => t.trim()))}
          />
          <EditDialog.InputTextArea
            name={"About"}
            label={"about"}
            value={about}
            setValue={setAbout}
          />
          <div className="mt-[25px] flex flex-wrap justify-between gap-2">
            {error ? (
              <div className="rounded-[10px] bg-[var(--error-red)] p-2.5 text-white">
                An error occurred.
              </div>
            ) : (
              <div></div>
            )}
            <Button className="Button green">Save changes</Button>
          </div>
        </form>
      </EditDialog.Content>
    </EditDialog.Root>
  );
}

function TableRow({
  course,
  languages,
  updateCourse,
}: {
  course: CourseProps;
  languages: Record<number, AdminLanguageProps>;
  updateCourse: (course: CourseProps) => void;
}) {
  const refRow = React.useRef<HTMLTableRowElement>(null);

  function updateCourseWrapper(new_course: CourseProps) {
    const frames = [
      { opacity: 0, filter: "blur(10px) saturate(0)" },
      { opacity: 1, filter: "" },
    ];
    const attributes: (keyof CourseProps)[] = [
      "id",
      "short",
      "learning_language",
      "from_language",
      "public",
      "name",
      "conlang",
      "tags",
      "about",
    ];

    function check_equal(attribute: keyof CourseProps) {
      if (attribute === "tags") {
        return (
          new_course[attribute].sort().join(",") ===
          course[attribute].sort().join(",")
        );
      }
      return new_course[attribute] === course[attribute];
    }

    for (let i = 0; i < attributes.length; i++) {
      if (!check_equal(attributes[i])) {
        /*console.log(
          "update",
          attributes[i],
          new_course[attributes[i]],
          course[attributes[i]],
        );*/
        if (refRow.current)
          refRow.current.children[i].animate(frames, {
            duration: 1000,
            iterations: 1,
          });
      }
    }
    updateCourse(new_course);
  }

  return (
    <tr
      ref={refRow}
      className="odd:bg-[var(--body-background)] even:bg-[color:color-mix(in_srgb,var(--body-background-faint)_74%,transparent)] hover:brightness-95"
    >
      <td className="px-4 py-2.5">{course.id}</td>
      <td className="px-3 py-2.5">
        {<Link href={"/" + course.short}>{course.short}</Link>}
      </td>
      <td className="px-3 py-2.5">
        <FlagName lang={course.learning_language} languages={languages} />
      </td>
      <td className="px-3 py-2.5">
        <FlagName lang={course.from_language} languages={languages} />
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className={course.public ? statusYesClass : statusNoClass}>
          {course.public ? "Yes" : "No"}
        </span>
      </td>
      <td className="px-3 py-2.5">{course.name}</td>
      <td className="px-3 py-2.5 text-center">
        <span className={course.conlang ? statusYesClass : statusNoClass}>
          {course.conlang ? "Yes" : "No"}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {course.tags.map((d) => (
            <Tag key={d}>{d}</Tag>
          ))}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap">
          {course.about}
        </div>
      </td>
      <td className="sticky right-0 z-[2] min-w-[138px] bg-inherit px-4 py-2.5 text-right whitespace-nowrap">
        <EditCourse
          obj={course}
          languages={languages}
          updateCourse={updateCourseWrapper}
          is_new={false}
        />
      </td>
    </tr>
  );
}

export function CourseList({
  all_courses,
  languages,
}: {
  all_courses: CourseProps[];
  languages: AdminLanguageProps[];
}) {
  const [search, setSearch] = React.useState("");
  const [my_courses, setMyCourses] = React.useState(all_courses);
  React.useEffect(() => {
    setMyCourses(all_courses);
  }, [all_courses]);

  function updateCourse(course: CourseProps) {
    setMyCourses(my_courses.map((c) => (c.id === course.id ? course : c)));
  }

  if (languages === undefined || my_courses === undefined) return <Spinner />;

  const languages_id: Record<number, AdminLanguageProps> = {};
  for (const l of languages) languages_id[l.id] = l;

  let filtered_courses: CourseProps[] = [];
  if (search === "") filtered_courses = my_courses;
  else {
    for (const course of my_courses) {
      if (!languages_id[course.learning_language]) continue;
      if (
        languages_id[course.learning_language].name
          .toLowerCase()
          .indexOf(search.toLowerCase()) !== -1 ||
        languages_id[course.from_language].name
          .toLowerCase()
          .indexOf(search.toLowerCase()) !== -1
      ) {
        filtered_courses.push(course);
      }
    }
  }

  return (
    <div className="relative isolate mx-auto my-6 mb-9 box-border w-full max-w-[min(1240px,calc(100vw-48px))] rounded-[18px] border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-[18px] shadow-[0_18px_42px_color-mix(in_srgb,#000_14%,transparent)]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-0.5 pb-3">
        <Input
          label={"Search"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <EditCourse
          obj={{
            id: 0,
            learning_language: -1,
            from_language: 1,
            official: false,
            short: "",
            name: "",
            public: false,
            about: "",
            tags: [],
            conlang: false,
          }}
          is_new={true}
          languages={languages_id}
          updateCourse={updateCourse}
        />
      </div>
      <div className="relative isolate overflow-auto rounded-[14px] border border-[color:color-mix(in_srgb,var(--header-border)_60%,transparent)]">
        <table
          id="story_list"
          data-cy="story_list"
          className="js-sort-table js-sort-5 js-sort-desc w-full min-w-[980px] border-collapse"
          data-js-sort-table="true"
        >
          <thead>
            <tr>
              <th className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"></th>
              <th className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"></th>
              <th
                className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="0"
              >
                learning_language
              </th>
              <th
                className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="1"
              >
                from_language
              </th>
              <th
                className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="1"
              >
                public
              </th>
              <th
                className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="2"
              >
                name
              </th>
              <th
                className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="2"
              >
                conlang
              </th>
              <th
                className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="2"
              >
                tags
              </th>
              <th
                className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="3"
              >
                about
              </th>
              <th
                className="sticky top-0 right-0 z-[3] min-w-[138px] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                data-js-sort-colnum="4"
              ></th>
            </tr>
          </thead>
          <tbody>
            {filtered_courses.map((course) => (
              <TableRow
                course={course}
                key={course.id}
                languages={languages_id}
                updateCourse={updateCourse}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
