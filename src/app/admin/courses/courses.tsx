"use client";
import Link from "next/link";
import styles from "../index.module.css";
import { Spinner } from "@/components/layout/spinner";
import Flag from "@/components/layout/flag";
import { fetch_post } from "@/lib/fetch_post";
import * as EditDialog from "../edit_dialog";
import React, { useState } from "react";
import styled from "styled-components";
import Button from "@/components/layout/button";
import Tag from "@/components/layout/tag";
import Input from "@/components/layout/Input";
import FlagName from "../FlagName";

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

  const [short, setShort] = useState(obj.short || "");
  const [fromLanguage, setFromLanguage] = useState(obj.from_language || 0);
  const [learningLanguage, setLearningLanguage] = useState(
    obj.learning_language || 0,
  );

  const [name, setName] = useState(obj.name || "");
  const [published, setPublished] = useState(obj.public || false);
  const [conlang, setConlang] = useState(obj.conlang || false);
  const [tags, setTags] = useState(obj.tags || "");
  const [about, setAbout] = useState(obj.about || "");

  async function Send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = {
      id: obj.id,
      short: short,
      from_language: fromLanguage,
      learning_language: learningLanguage,
      name: name,
      public: published,
      conlang: conlang,
      tags: tags,
      about: about,
    };
    //console.log("send", data);

    try {
      let res = await fetch_post(`/admin/courses/set`, data);
      let new_data = await res.json();
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
          <div
            style={{
              display: "flex",
              marginTop: 25,
              justifyContent: "space-between",
            }}
          >
            {error ? <Error>An error occurred.</Error> : <div></div>}
            <Button className="Button green">Save changes</Button>
          </div>
        </form>
      </EditDialog.Content>
    </EditDialog.Root>
  );
}

const Error = styled.div`
  color: #fff;
  border-radius: 10px;
  padding: 10px;
  background: var(--error-red);
`;

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
    <tr ref={refRow}>
      <td>{course.id}</td>
      <td>{<Link href={"/" + course.short}>{course.short}</Link>}</td>
      <td>
        <FlagName lang={course.learning_language} languages={languages} />
      </td>
      <td>
        <FlagName lang={course.from_language} languages={languages} />
      </td>
      <td style={{ textAlign: "center" }}>{course.public ? "✅" : "❌"}</td>
      <td>{course.name}</td>
      <td style={{ textAlign: "center" }}>{course.conlang ? "✅" : "❌"}</td>
      <td>
        {course.tags.map((d) => (
          <Tag key={d}>{d}</Tag>
        ))}
      </td>
      <td>
        <AboutWrapper>{course.about}</AboutWrapper>
      </td>
      <td>
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
    <Wrapper>
      <SearchBar>
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
      </SearchBar>
      <table
        id="story_list"
        data-cy="story_list"
        className={"js-sort-table js-sort-5 js-sort-desc " + styles.admin_table}
        data-js-sort-table="true"
      >
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th data-js-sort-colnum="0">learning_language</th>
            <th data-js-sort-colnum="1">from_language</th>
            <th data-js-sort-colnum="1">public</th>
            <th data-js-sort-colnum="2">name</th>
            <th data-js-sort-colnum="2">conlang</th>
            <th data-js-sort-colnum="2">tags</th>
            <th data-js-sort-colnum="3">about</th>
            <th data-js-sort-colnum="4"></th>
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
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: fit-content;
  margin: 0 auto;
`;

const SearchBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
`;

const AboutWrapper = styled.div`
  white-space: nowrap;
  overflow: hidden;
  width: 200px;
  text-overflow: ellipsis;
`;
