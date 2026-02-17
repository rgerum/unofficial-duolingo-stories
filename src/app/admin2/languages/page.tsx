"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Flag from "@/components/ui/flag";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AdminLanguage = {
  id?: number;
  name: string;
  short: string;
  flag: number;
  flag_file: string;
  speaker: string;
  rtl: boolean;
};

function LanguageDialog({
  initial,
  triggerLabel,
  onSaved,
  triggerVariant = "secondary",
}: {
  initial: AdminLanguage;
  triggerLabel: string;
  onSaved: (lang: AdminLanguage) => void;
  triggerVariant?: "default" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AdminLanguage>(initial);
  const [error, setError] = useState<string>("");
  const createLanguage = useMutation(api.adminWrite.createAdminLanguage);
  const updateLanguage = useMutation(api.adminWrite.updateAdminLanguage);

  async function submit() {
    setError("");
    try {
      const payload = {
        name: form.name,
        short: form.short,
        flag: Number.parseInt(String(form.flag), 10) || 0,
        flag_file: form.flag_file,
        speaker: form.speaker,
        rtl: Boolean(form.rtl),
      };

      const result =
        form.id === undefined
          ? await createLanguage({
              ...payload,
              operationKey: `language:create:${payload.short}:admin2`,
            })
          : await updateLanguage({
              id: form.id,
              ...payload,
              operationKey: `language:${form.id}:admin_set:admin2`,
            });

      onSaved(result as AdminLanguage);
      setOpen(false);
    } catch {
      setError("Save failed. Please retry.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit language" : "Add language"}</DialogTitle>
          <DialogDescription>
            Update language metadata used by editor, story runtime, and course associations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {([
            ["Name", "name"],
            ["Short", "short"],
            ["Flag", "flag"],
            ["Flag File", "flag_file"],
            ["Default Voice", "speaker"],
          ] as const).map(([label, key]) => (
            <div key={key} className="grid gap-1.5">
              <Label>{label}</Label>
              <Input
                value={String(form[key] ?? "")}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value } as AdminLanguage))
                }
              />
            </div>
          ))}

          <div className="inline-flex items-center gap-2">
            <Checkbox
              id="rtl"
              checked={Boolean(form.rtl)}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, rtl: checked === true }))
              }
            />
            <Label htmlFor="rtl">RTL</Label>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-sm text-rose-600">{error}</div>
          <Button onClick={submit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Admin2LanguagesPage() {
  const data = useQuery(api.adminData.getAdminLanguages, {});
  const [search, setSearch] = useState("");
  const [localPatch, setLocalPatch] = useState<Record<number, AdminLanguage>>({});
  const merged = useMemo(
    () => (data ?? []).map((lang) => localPatch[lang.id] ?? (lang as AdminLanguage)),
    [data, localPatch],
  );
  const filtered = useMemo(
    () =>
      merged.filter((lang) =>
        lang.name.toLowerCase().includes(search.toLowerCase().trim()),
      ),
    [merged, search],
  );

  if (data === undefined) {
    return <div className="text-sm text-slate-500">Loading languages...</div>;
  }

  function onSaved(lang: AdminLanguage) {
    if (lang.id) {
      setLocalPatch((prev) => ({ ...prev, [lang.id as number]: lang }));
    }
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-full max-w-[320px] space-y-1.5">
              <Label>Search languages</Label>
              <Input
                placeholder="Type a language name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <LanguageDialog
              initial={{
                name: "",
                short: "",
                flag: 0,
                flag_file: "",
                speaker: "",
                rtl: false,
            }}
            triggerLabel="Add language"
            triggerVariant="default"
            onSaved={onSaved}
          />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-auto">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow className="border-b-0">
              {["ID", "", "Name", "ISO", "Duo Flag", "Flag File", "Default Voice", "RTL", ""].map(
                (header, index) => (
                  <TableHead key={`${header}-${index}`}>{header}</TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lang, index) => (
              <TableRow key={`${lang.id}-${index}`}>
                <TableCell>{lang.id}</TableCell>
                <TableCell>
                  <Flag iso={lang.short} width={36} flag={lang.flag} flag_file={lang.flag_file} />
                </TableCell>
                <TableCell>{lang.name}</TableCell>
                <TableCell>{lang.short}</TableCell>
                <TableCell>{lang.flag}</TableCell>
                <TableCell>{lang.flag_file}</TableCell>
                <TableCell>{lang.speaker}</TableCell>
                <TableCell>
                  <Badge variant={lang.rtl ? "success" : "default"}>{lang.rtl ? "Yes" : "No"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <LanguageDialog initial={lang} triggerLabel="Edit" onSaved={onSaved} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
