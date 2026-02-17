"use client";

import { useInput } from "@/lib/hooks";
import { Spinner } from "@/components/ui/spinner";
import Flag from "@/components/ui/flag";
import Input from "@/components/ui/input";
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import * as EditDialog from "../edit_dialog";
import Button from "@/components/ui/button";

interface Language {
  id?: number;
  name: string;
  short: string;
  flag: number;
  flag_file: string;
  speaker: string;
  rtl: boolean;
}

interface EditLanguageProps {
  obj: Language;
  updateLanguage: (lang: Language) => void;
  is_new?: boolean;
}

function EditLanguage({ obj, updateLanguage, is_new }: EditLanguageProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const createLanguageMutation = useMutation(api.adminWrite.createAdminLanguage);
  const updateLanguageMutation = useMutation(api.adminWrite.updateAdminLanguage);

  const [name, setName] = useState(obj.name);
  const [short, setShort] = useState(obj.short);
  const [flag, setFlag] = useState(String(obj.flag));
  const [flag_file, setFlagFile] = useState(obj.flag_file);
  const [speaker, setSpeaker] = useState(obj.speaker);
  const [rtl, setRTL] = useState(obj.rtl);

  async function send() {
    const data: Language = {
      id: obj.id,
      name,
      short,
      flag: Number.parseInt(flag, 10) || 0,
      flag_file,
      speaker,
      rtl,
    };

    try {
      let newData;
      if (data.id !== undefined) {
        newData = await updateLanguageMutation({
          id: data.id,
          name: data.name,
          short: data.short,
          flag: data.flag,
          flag_file: data.flag_file,
          speaker: data.speaker,
          rtl: data.rtl,
          operationKey: `language:${data.id}:admin_set:client`,
        });
      } else {
        newData = await createLanguageMutation({
          name: data.name,
          short: data.short,
          flag: data.flag,
          flag_file: data.flag_file,
          speaker: data.speaker,
          rtl: data.rtl,
          operationKey: `language:create:${data.short}:client`,
        });
      }
      setOpen(false);
      updateLanguage(newData);
    } catch {
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
        <EditDialog.InputText name="Name" label="name" value={name} setValue={setName} />
        <EditDialog.InputText name="Short" label="short" value={short} setValue={setShort} />
        <EditDialog.InputText name="Flag" label="flag" value={flag} setValue={setFlag} />
        <EditDialog.InputText
          name="Flag File"
          label="flag_file"
          value={flag_file}
          setValue={setFlagFile}
        />
        <EditDialog.InputText
          name="Default Voice"
          label="speaker"
          value={speaker}
          setValue={setSpeaker}
        />
        <EditDialog.InputBool name="RTL" label="rtl" value={rtl} setValue={setRTL} />
        <div className="mt-[25px] flex flex-wrap justify-between gap-2">
          {error ? (
            <div className="rounded-[10px] bg-[var(--error-red)] p-2.5 text-white">
              An error occurred.
            </div>
          ) : (
            <div></div>
          )}
          <Button className="Button green" onClick={send}>
            Save changes
          </Button>
        </div>
      </EditDialog.Content>
    </EditDialog.Root>
  );
}

interface TableRowProps {
  lang: Language;
  updateLanguage: (lang: Language) => void;
}

function TableRow({ lang, updateLanguage }: TableRowProps) {
  const refRow = React.useRef<HTMLTableRowElement>(null);

  function updateLanguageWrapper(newCourse: Language) {
    const frames = [
      { opacity: 0, filter: "blur(10px) saturate(0)" },
      { opacity: 1, filter: "" },
    ];
    const attributes = ["id", "", "name", "short", "flag", "flag_file", "speaker", "rtl"];

    function checkEqual(attribute: string) {
      const newVal = (newCourse as unknown as Record<string, unknown>)[attribute];
      const oldVal = (lang as unknown as Record<string, unknown>)[attribute];
      return newVal === oldVal;
    }

    for (let i = 0; i < attributes.length; i++) {
      if (!checkEqual(attributes[i]) && refRow.current?.children[i]) {
        (refRow.current.children[i] as HTMLElement).animate(frames, {
          duration: 1000,
          iterations: 1,
        });
      }
    }
    updateLanguage(newCourse);
  }

  return (
    <tr ref={refRow} className="odd:bg-[var(--body-background)] even:bg-[color:color-mix(in_srgb,var(--body-background-faint)_74%,transparent)] hover:brightness-95">
      <td className="px-4 py-2.5">{lang.id}</td>
      <td className="px-3 py-2.5">
        <Flag iso={lang.short} width={40} flag={lang.flag} flag_file={lang.flag_file} />
      </td>
      <td className="px-3 py-2.5">{lang.name}</td>
      <td className="px-3 py-2.5">{lang.short}</td>
      <td className="px-3 py-2.5">{lang.flag}</td>
      <td className="px-3 py-2.5">{lang.flag_file}</td>
      <td className="px-3 py-2.5">{lang.speaker}</td>
      <td className="px-3 py-2.5">{String(lang.rtl)}</td>
      <td className="px-4 py-2.5 text-right">
        <EditLanguage obj={lang} updateLanguage={updateLanguageWrapper} />
      </td>
    </tr>
  );
}

interface LanguageListProps {
  all_languages: Language[];
}

export default function LanguageList({ all_languages }: LanguageListProps) {
  const [search, setSearch] = useInput("");
  const [myLangs, setMyLangs] = useState<Language[]>(all_languages);

  React.useEffect(() => {
    setMyLangs(all_languages);
  }, [all_languages]);

  function updateLanguage(course: Language) {
    setMyLangs(myLangs.map((c) => (c.id === course.id ? course : c)));
  }

  if (all_languages === undefined) return <Spinner />;

  const filteredLanguages =
    search === ""
      ? myLangs
      : myLangs.filter((language) =>
          language.name.toLowerCase().includes(search.toLowerCase()),
        );

  return (
    <div className="relative isolate mx-auto my-6 mb-9 box-border w-full max-w-[min(1240px,calc(100vw-48px))] rounded-[18px] border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-[18px] shadow-[0_18px_42px_color-mix(in_srgb,#000_14%,transparent)]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-0.5 pb-3">
        <Input label="Search" value={search} onChange={setSearch} />
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
      </div>
      <div className="relative isolate overflow-auto rounded-[14px] border border-[color:color-mix(in_srgb,var(--header-border)_60%,transparent)]">
        <table id="story_list" data-cy="story_list" className="w-full min-w-[940px] border-collapse" data-js-sort-table="true">
          <thead>
            <tr>
              {["ID", "", "Name", "ISO", "Duo Flag", "Flag File", "Default Voice", "RTL", ""].map(
                (header, idx) => (
                  <th
                    key={`${header}-${idx}`}
                    className="sticky top-0 z-[1] bg-[color:color-mix(in_srgb,var(--button-background)_88%,#fff)] px-3 py-2 text-left text-[0.84rem] uppercase tracking-[0.03em] text-[var(--button-color)]"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filteredLanguages.map((lang, i) => (
              <TableRow key={i} lang={lang} updateLanguage={updateLanguage} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
