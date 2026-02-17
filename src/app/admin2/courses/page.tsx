"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@/components/ui/shadcn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AdminCourse = {
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
};

type AdminLanguage = {
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
};

function LanguageCell({
  langId,
  languages,
}: {
  langId: number;
  languages: Record<number, AdminLanguage>;
}) {
  const lang = languages[langId];
  if (!lang) return "-";
  return (
    <span className="inline-flex items-center gap-2">
      <Flag
        iso={lang.short}
        width={30}
        flag={lang.flag}
        flag_file={lang.flag_file}
      />
      {lang.name}
    </span>
  );
}

function CourseDialog({
  initial,
  languages,
  triggerLabel,
  onSaved,
  triggerVariant = "secondary",
}: {
  initial: Partial<AdminCourse>;
  languages: AdminLanguage[];
  triggerLabel: string;
  onSaved: (course: AdminCourse) => void;
  triggerVariant?: "default" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: initial.id,
    learning_language: initial.learning_language ?? languages[0]?.id ?? 0,
    from_language: initial.from_language ?? languages[0]?.id ?? 0,
    name: initial.name ?? "",
    short: initial.short ?? "",
    public: Boolean(initial.public),
    conlang: Boolean(initial.conlang),
    tags: (initial.tags ?? []).join(","),
    about: initial.about ?? "",
  });

  const createCourse = useMutation(api.adminWrite.createAdminCourse);
  const updateCourse = useMutation(api.adminWrite.updateAdminCourse);

  async function submit() {
    setError("");
    const payload = {
      learning_language: Number(form.learning_language),
      from_language: Number(form.from_language),
      public: Boolean(form.public),
      name: form.name,
      conlang: Boolean(form.conlang),
      tags: form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      about: form.about,
    };

    try {
      const result =
        form.id === undefined
          ? await createCourse({
              ...payload,
              operationKey: `course:create:${payload.learning_language}:${payload.from_language}:admin2`,
            })
          : await updateCourse({
              id: Number(form.id),
              ...payload,
              operationKey: `course:${form.id}:admin_set:admin2`,
            });
      onSaved(result as AdminCourse);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit course" : "Add course"}</DialogTitle>
          <DialogDescription>
            Configure source/learning languages, publishing flags, and metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Short</Label>
            <Input
              value={form.short}
              onChange={(e) => setForm((prev) => ({ ...prev, short: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tags</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="main, grammar"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>From language</Label>
            <Select
              value={form.from_language}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, from_language: Number(e.target.value) }))
              }
              options={languages.map((lang) => ({ label: lang.name, value: String(lang.id) }))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Learning language</Label>
            <Select
              value={form.learning_language}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, learning_language: Number(e.target.value) }))
              }
              options={languages.map((lang) => ({ label: lang.name, value: String(lang.id) }))}
            />
          </div>

          <div className="inline-flex items-center gap-2">
            <Checkbox
              id="public"
              checked={form.public}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, public: checked === true }))
              }
            />
            <Label htmlFor="public">Public</Label>
          </div>

          <div className="inline-flex items-center gap-2">
            <Checkbox
              id="conlang"
              checked={form.conlang}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, conlang: checked === true }))
              }
            />
            <Label htmlFor="conlang">Conlang</Label>
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <Label>About</Label>
            <Textarea value={form.about} onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))} />
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

function BoolPill({ active }: { active: boolean }) {
  return <Badge variant={active ? "success" : "danger"}>{active ? "Yes" : "No"}</Badge>;
}

export default function Admin2CoursesPage() {
  const data = useQuery(api.adminData.getAdminCourses, {});
  const [search, setSearch] = useState("");
  const [localPatch, setLocalPatch] = useState<Record<number, AdminCourse>>({});
  const languages = useMemo(
    () => ((data?.languages as AdminLanguage[] | undefined) ?? []),
    [data],
  );
  const sourceCourses = useMemo(() => data?.courses ?? [], [data]);
  const languageById = useMemo(
    () => Object.fromEntries(languages.map((l) => [l.id, l])),
    [languages],
  );
  const merged = useMemo(
    () => sourceCourses.map((course) => localPatch[course.id] ?? (course as AdminCourse)),
    [sourceCourses, localPatch],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return merged;
    return merged.filter((course) => {
      const learning = languageById[course.learning_language]?.name?.toLowerCase() ?? "";
      const from = languageById[course.from_language]?.name?.toLowerCase() ?? "";
      return learning.includes(q) || from.includes(q) || (course.name ?? "").toLowerCase().includes(q);
    });
  }, [merged, search, languageById]);

  if (data === undefined) {
    return <div className="text-sm text-slate-500">Loading courses...</div>;
  }

  function onSaved(course: AdminCourse) {
    setLocalPatch((prev) => ({ ...prev, [course.id]: course }));
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-full max-w-[340px] space-y-1.5">
              <Label>Search courses</Label>
              <Input
                placeholder="Language or course name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <CourseDialog
              initial={{
                learning_language: languages[0]?.id ?? 0,
                from_language: languages[0]?.id ?? 0,
                public: false,
                conlang: false,
                name: "",
                short: "",
                tags: [],
                about: "",
              }}
              languages={languages}
              triggerLabel="Add course"
              triggerVariant="default"
              onSaved={onSaved}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-auto">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow className="border-b-0">
              {["ID", "Short", "Learning", "From", "Public", "Name", "Conlang", "Tags", "About", ""].map(
                (header) => (
                  <TableHead key={header || "actions"}>{header}</TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((course, index) => (
              <TableRow key={course.id}>
                <TableCell>{course.id}</TableCell>
                <TableCell>
                  <Link href={`/${course.short ?? ""}`} className="underline underline-offset-2">
                    {course.short}
                  </Link>
                </TableCell>
                <TableCell>
                  <LanguageCell langId={course.learning_language} languages={languageById} />
                </TableCell>
                <TableCell>
                  <LanguageCell langId={course.from_language} languages={languageById} />
                </TableCell>
                <TableCell>
                  <BoolPill active={course.public} />
                </TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell>
                  <BoolPill active={course.conlang} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {course.tags.map((tag) => (
                      <Badge key={`${course.id}-${tag}-${index}`} variant="default" className="rounded-md">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px]">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{course.about}</div>
                </TableCell>
                <TableCell className="text-right">
                  <CourseDialog
                    initial={course}
                    languages={languages}
                    triggerLabel="Edit"
                    onSaved={onSaved}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
