"use client";
import styles from "../index.module.css";
import { useInput } from "@/lib/hooks";
import { Spinner } from "@/components/layout/spinner";
import Flag from "@/components/layout/flag.tsx";
import { fetch_post } from "@/lib/fetch_post";
import styled from "styled-components";
import Input from "@/components/layout/Input";
import React, { useState } from "react";
import * as EditDialog from "../edit_dialog";
import Button from "@/components/layout/button";

export async function setLanguage(data) {
  let res = await fetch_post(`/admin/languages/set`, data);
  res = await res.text();
  return res;
}

function ChangeAbleValue(props) {
  const [value, setValue] = useInput(props.obj[props.name]);

  function edited(e) {
    props.callback(props.name, e.target.value);
    setValue(e);
  }

  if (props.edit)
    return (
      <td>
        <input value={value} onChange={edited} />
      </td>
    );
  return <td>{value}</td>;
}

function EditLanguage({ obj, updateLanguage, is_new }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(undefined);

  const [name, setName] = useState(obj.name);
  const [short, setShort] = useState(obj.short);
  const [flag, setFlag] = useState(obj.flag);
  const [flag_file, setFlagFile] = useState(obj.flag_file);
  const [speaker, setSpeaker] = useState(obj.speaker);
  const [rtl, setRTL] = useState(obj.rtl);

  async function Send() {
    const data = {
      id: obj.id,
      name: name,
      short: short,
      flag: flag,
      flag_file: flag_file,
      speaker: speaker,
      rtl: rtl,
    };
    console.log("send", data);

    try {
      let res = await fetch_post(`/admin/languages/set`, data);
      let new_data = await res.json();
      console.log("new_data", new_data);
      setOpen(false);
      updateLanguage(new_data);
    } catch (e) {
      console.log("error", e);
      setError("An error occurred. Please report in Discord.");
    }
  }

  return (
    <EditDialog.Root open={open} onOpenChange={setOpen}>
      <EditDialog.Trigger asChild>
        <EditDialog.Button style={{ marginLeft: "auto" }}>
          {is_new ? "Add" : "Edit"}
        </EditDialog.Button>
      </EditDialog.Trigger>
      <EditDialog.Content>
        <EditDialog.DialogTitle>
          {is_new ? "Add" : "Edit"} Language
        </EditDialog.DialogTitle>
        <EditDialog.DialogDescription>
          {is_new
            ? "Add a new language. Click save when you're done."
            : "Make changes to a language. Click save when you're done."}
        </EditDialog.DialogDescription>
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
        <EditDialog.InputText
          name={"Flag"}
          label={"flag"}
          value={flag}
          setValue={setFlag}
        />
        <EditDialog.InputText
          name={"Flag File"}
          label={"flag_file"}
          value={flag_file}
          setValue={setFlagFile}
        />
        <EditDialog.InputText
          name={"Default Voice"}
          label={"speaker"}
          value={speaker}
          setValue={setSpeaker}
        />
        <EditDialog.InputBool
          name={"RTL"}
          label={"rtl"}
          value={rtl}
          setValue={setRTL}
        />
        <div
          style={{
            display: "flex",
            marginTop: 25,
            justifyContent: "space-between",
          }}
        >
          {error ? <Error>An error occurred.</Error> : <div></div>}
          <Button className="Button green" onClick={Send}>
            Save changes
          </Button>
        </div>
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

function TableRow({ lang, updateLanguage }) {
  const refRow = React.useRef();

  function updateLanguageWrapper(new_course) {
    const frames = [
      { opacity: 0, filter: "blur(10px) saturate(0)" },
      { opacity: 1, filter: "" },
    ];
    const attributes = [
      "id",
      "",
      "name",
      "short",
      "flag",
      "flag_file",
      "speaker",
      "rtl",
    ];

    function check_equal(attribute) {
      return new_course[attribute] === lang[attribute];
    }

    for (let i = 0; i < attributes.length; i++) {
      if (!check_equal(attributes[i])) {
        refRow.current.children[i].animate(frames, {
          duration: 1000,
          iterations: 1,
        });
      }
    }
    updateLanguage(new_course);
  }

  return (
    <tr ref={refRow}>
      <td> {lang.id}</td>
      <td>
        <Flag
          iso={lang.short}
          width={40}
          flag={lang.flag}
          flag_file={lang.flag_file}
        />
      </td>
      <td>{lang.name}</td>
      <td>{lang.short}</td>
      <td>{lang.flag}</td>
      <td>{lang.flag_file}</td>
      <td>{lang.speaker}</td>
      <td>{lang.rtl}</td>
      <td>
        <EditLanguage obj={lang} updateLanguage={updateLanguageWrapper} />
      </td>
    </tr>
  );
}

export default function LanguageList({ all_languages }) {
  const [search, setSearch] = useInput("");

  const [my_langs, setMyLangs] = useInput(all_languages);

  function updateLanguage(course) {
    setMyLangs(my_langs.map((c) => (c.id === course.id ? course : c)));
  }

  if (all_languages === undefined) return <Spinner />;

  let filtered_languages = [];
  if (search === "") filtered_languages = my_langs;
  else {
    for (let language of my_langs) {
      if (language.name.toLowerCase().indexOf(search.toLowerCase()) !== -1) {
        filtered_languages.push(language);
      }
    }
  }
  /*
    https://admin.duostories.org/get2/language_list
     */
  return (
    <Wrapper>
      <SearchBar>
        <Input label={"Search"} value={search} onChange={setSearch} />
        <EditLanguage
          obj={{
            name: "",
            short: "",
            flag: 0,
            flag_file: "",
            speaker: "",
            rtl: false,
          }}
          is_new={true}
          updateLanguage={updateLanguage}
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
            <th>ID</th>
            <th></th>
            <th data-js-sort-colnum="0">Name</th>
            <th data-js-sort-colnum="1">ISO</th>
            <th data-js-sort-colnum="1">Duo Flag</th>
            <th data-js-sort-colnum="2">Flag File</th>
            <th data-js-sort-colnum="4">Default Voice</th>
            <th data-js-sort-colnum="4">RTL</th>
            <th data-js-sort-colnum="4"></th>
          </tr>
        </thead>
        <tbody>
          {filtered_languages.map((lang) => (
            <TableRow lang={lang} updateLanguage={updateLanguage} />
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
