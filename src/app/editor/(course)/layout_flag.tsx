"use client";
import { BookOpenIcon, EllipsisIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import EditorButton from "../editor_button";
import MobileEditorHeader, {
  MobileEditorMenuLink,
} from "../_components/mobile_editor_header";
import { Breadcrumbs } from "../_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "../_components/header_context";
import type { CourseProps } from "./types";
import LanguageFlag from "@/components/ui/language-flag";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface BreadcrumbPath {
  type: string;
  href?: string;
  name?: string;
  lang1?: {
    languageId: string;
    name: string;
  };
  lang2?: {
    languageId: string;
    name: string;
  };
}

export default function LayoutFlag() {
  const data = useQuery(api.editorRead.getEditorSidebarData, {});
  const courses = (data?.courses ?? []) as CourseProps[];

  const segment = useSelectedLayoutSegments();
  const nestedRoute = segment[2];
  const import_id = nestedRoute === "import" ? segment[3] : undefined;

  if (segment[0] === "feedback") {
    return null;
  }

  if (
    nestedRoute === "story" ||
    nestedRoute === "feedback" ||
    nestedRoute === "voices" ||
    nestedRoute === "localization"
  ) {
    return null;
  }

  let course: CourseProps | undefined = undefined;
  let course_import: CourseProps | undefined = undefined;

  for (let c of courses) {
    if (c.short === segment[1] || `${c.id}` === segment[1]) {
      course = c;
    }
    if (c.short === segment[3] || `${c.id}` === segment[3]) {
      course_import = c;
    }
  }
  let path: BreadcrumbPath[] = [{ type: "Editor" }];
  if (course) {
    path = [
      { type: "Editor", href: `/editor` },
      { type: "sep" },
      {
        type: "course",
        lang1: {
          languageId: course.learningLanguageId,
          name: course.learning_language_name,
        },
        lang2: {
          languageId: course.fromLanguageId,
          name: course.from_language_name,
        },
      },
    ];
  }
  if (import_id && course && course_import) {
    path[path.length - 1].href = `/editor/course/${course.short}`;
    path.push({ type: "sep" });
    path.push({
      type: "course",
      name: "Import",
      lang1: {
        languageId: course_import.learningLanguageId,
        name: course_import.learning_language_name,
      },
      lang2: {
        languageId: course_import.fromLanguageId,
        name: course_import.from_language_name,
      },
    });
  }
  return (
    <>
      <EditorHeaderBreadcrumbs>
        <Breadcrumbs path={path} />
      </EditorHeaderBreadcrumbs>
      <EditorHeaderActions>
        {course ? (
          <>
            {course.official ? (
              <span className="pr-[15px]" data-cy="label_official">
                <i>official</i>
              </span>
            ) : !import_id ? (
              <EditorButton
                id="button_import"
                href={`/editor/course/${course.short}/import/es-en`}
                data-cy="button_import"
                img={"import.svg"}
                text={"Import"}
              />
            ) : (
              <EditorButton
                id="button_back"
                href={`/editor/course/${course.short}`}
                data-cy="button_back"
                img={"back.svg"}
                text={"Back"}
              />
            )}
            {!import_id ? (
              <EditorButton
                id="button_feedback"
                href={`/editor/course/${course.short}/feedback`}
                data-cy="button_feedback"
                img="stories.png"
                text="Feedback"
              />
            ) : null}
            <div className="ml-[50px] max-[1120px]:ml-0" />
          </>
        ) : (
          <EditorButton
            id="button_feedback"
            href="/editor/feedback"
            data-cy="button_feedback"
            img="stories.png"
            text="Feedback"
          />
        )}
      </EditorHeaderActions>
      {segment.length === 0 ? (
        <EditorRootMobileHeader />
      ) : segment[0] === "course" ? (
        import_id ? (
          <ImportMobileHeader
            courseId={segment[1] ?? ""}
            fromId={import_id}
            sourceCourse={course_import}
          />
        ) : course ? (
          <CourseMobileHeader course={course} />
        ) : (
          <CourseMobileHeaderLoading />
        )
      ) : null}
    </>
  );
}

function EditorRootMobileHeader() {
  return (
    <MobileEditorHeader
      backHref="/"
      backLabel="Back to stories"
      icon={<BookOpenIcon className="mr-1.5 size-5 shrink-0" />}
      title="Courses"
      subtitle="Editor"
    >
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="More editor options"
            className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-color)] transition-colors hover:bg-[var(--header-border)]"
          >
            <EllipsisIcon className="size-6" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          className="max-h-[min(82dvh,38rem)] overflow-y-auto rounded-t-3xl border-[var(--header-border)] bg-[var(--body-background)] p-0 pb-[env(safe-area-inset-bottom)] text-[var(--text-color)]"
        >
          <SheetHeader className="border-b border-[var(--header-border)]">
            <SheetTitle>Editor options</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col px-4 pb-4">
            <MobileEditorMenuLink href="/editor/feedback">
              Feedback
            </MobileEditorMenuLink>
            <MobileEditorMenuLink href="/editor/interest">
              Courses ranked by learner interest
            </MobileEditorMenuLink>
            <MobileEditorMenuLink href="/profile">Account</MobileEditorMenuLink>
          </div>
        </SheetContent>
      </Sheet>
    </MobileEditorHeader>
  );
}

function ImportMobileHeader({
  courseId,
  fromId,
  sourceCourse,
}: {
  courseId: string;
  fromId: string;
  sourceCourse?: CourseProps;
}) {
  return (
    <MobileEditorHeader
      backHref={`/editor/course/${courseId}`}
      backLabel="Back to course"
      icon={
        sourceCourse ? (
          <span className="relative h-7 w-8 shrink-0">
            <LanguageFlag
              languageId={sourceCourse.learningLanguageId}
              width={24}
              className="absolute left-0 top-0"
            />
            <LanguageFlag
              languageId={sourceCourse.fromLanguageId}
              width={21}
              className="absolute right-0 bottom-0"
            />
          </span>
        ) : undefined
      }
      title="Import stories"
      subtitle={`from ${fromId}`}
    />
  );
}

function CourseMobileHeader({ course }: { course: CourseProps }) {
  return (
    <MobileEditorHeader
      backHref="/editor"
      backLabel="Back to editor"
      icon={
        <span className="relative h-7 w-8 shrink-0">
          <LanguageFlag
            languageId={course.learningLanguageId}
            width={24}
            className="absolute left-0 top-0"
          />
          <LanguageFlag
            languageId={course.fromLanguageId}
            width={21}
            className="absolute bottom-0 right-0"
          />
        </span>
      }
      title={course.learning_language_name}
      subtitle={`from ${course.from_language_name}`}
    >
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="More course options"
            className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-color)] transition-colors hover:bg-[var(--header-border)]"
          >
            <EllipsisIcon className="size-6" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          className="max-h-[min(82dvh,38rem)] overflow-y-auto rounded-t-3xl border-[var(--header-border)] bg-[var(--body-background)] p-0 pb-[env(safe-area-inset-bottom)] text-[var(--text-color)]"
        >
          <SheetHeader className="border-b border-[var(--header-border)]">
            <SheetTitle>Course options</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col px-4 pb-4">
            {!course.official ? (
              <MobileEditorMenuLink
                href={`/editor/course/${course.short}/import/es-en`}
              >
                Import stories
              </MobileEditorMenuLink>
            ) : null}
            <MobileEditorMenuLink
              href={`/editor/course/${course.short}/feedback`}
            >
              Feedback
            </MobileEditorMenuLink>
            <MobileEditorMenuLink
              href={`/editor/course/${course.short}/voices`}
            >
              Character voices
            </MobileEditorMenuLink>
            {course.from_language_name !== "English" ? (
              <MobileEditorMenuLink
                href={`/editor/course/${course.short}/localization`}
              >
                Localization
              </MobileEditorMenuLink>
            ) : null}
            <MobileEditorMenuLink href="/profile">Account</MobileEditorMenuLink>
          </div>
        </SheetContent>
      </Sheet>
    </MobileEditorHeader>
  );
}

function CourseMobileHeaderLoading() {
  return (
    <MobileEditorHeader
      backHref="/editor"
      backLabel="Back to editor"
      icon={
        <div className="size-7 animate-pulse rounded-full bg-[var(--header-border)]" />
      }
      title={
        <div className="h-4 w-28 animate-pulse rounded bg-[var(--header-border)]" />
      }
      subtitle={
        <div className="mt-1 h-3 w-20 animate-pulse rounded bg-[var(--header-border)]" />
      }
    >
      <div className="size-11" />
    </MobileEditorHeader>
  );
}
