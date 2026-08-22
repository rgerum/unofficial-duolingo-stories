"use client";
import {
  BookOpenIcon,
  HeartIcon,
  MessageSquareTextIcon,
  PinIcon,
} from "lucide-react";
import React from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import CourseMobileHeaderIllustration from "@/app/editor/_components/course_mobile_header_illustration";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import MobileEditorHeader, {
  MobileEditorMenuLink,
  mobileEditorMenuItemClassName,
} from "@/app/editor/_components/mobile_editor_header";
import MobileEditorOptionsSheet from "@/app/editor/_components/mobile_editor_options_sheet";
import { useCoursePin } from "@/app/editor/_components/use_course_pin";
import EditorButton from "@/app/editor/editor_button";
import { getFeedbackMobileHeaderRoute } from "./layout_flag_state";
import type { CourseProps } from "./types";

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
  const segment = useSelectedLayoutSegments();
  const nestedRoute = segment[2];
  const feedbackHeaderRoute = getFeedbackMobileHeaderRoute(segment);
  const import_id = nestedRoute === "import" ? segment[3] : undefined;
  const suppressLayoutHeader =
    segment[0] === "feedback" ||
    nestedRoute === "story" ||
    nestedRoute === "feedback" ||
    nestedRoute === "voices" ||
    nestedRoute === "localization" ||
    nestedRoute === "stats";
  const data = useQuery(
    api.editorRead.getEditorSidebarData,
    suppressLayoutHeader ? "skip" : {},
  );
  const courses = (data?.courses ?? []) as CourseProps[];

  if (feedbackHeaderRoute) {
    return <FeedbackMobileHeader courseId={feedbackHeaderRoute.courseId} />;
  }

  if (suppressLayoutHeader) {
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
    path[path.length - 1].href = `/editor/course/${course.short ?? course.id}`;
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
                href={`/editor/course/${course.short ?? course.id}/import/es-en`}
                data-cy="button_import"
                img={"import.svg"}
                text={"Import"}
              />
            ) : (
              <EditorButton
                id="button_back"
                href={`/editor/course/${course.short ?? course.id}`}
                data-cy="button_back"
                img={"back.svg"}
                text={"Back"}
              />
            )}
            {!import_id ? (
              <EditorButton
                id="button_feedback"
                href={`/editor/course/${course.short ?? course.id}/feedback`}
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
      ) : segment[0] === "interest" ? (
        <InterestMobileHeader />
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

function FeedbackMobileHeader({ courseId }: { courseId?: string }) {
  const course = useQuery(
    api.editorRead.getEditorCourseByIdentifier,
    courseId ? { identifier: courseId } : "skip",
  ) as CourseProps | null | undefined;
  const courseIdentifier = course?.short ?? courseId;
  const courseHref = courseIdentifier
    ? `/editor/course/${courseIdentifier}`
    : undefined;

  return (
    <MobileEditorHeader
      backHref={courseHref ?? "/editor"}
      backLabel={courseHref ? "Back to course" : "Back to editor"}
      icon={
        <span className="grid w-8 shrink-0 place-items-center">
          <MessageSquareTextIcon className="size-5" />
        </span>
      }
      title="Feedback"
      subtitle={courseIdentifier}
    />
  );
}

function InterestMobileHeader() {
  return (
    <MobileEditorHeader
      backHref="/editor"
      backLabel="Back to editor"
      icon={
        <span className="grid w-8 shrink-0 place-items-center">
          <HeartIcon
            className="size-5 fill-current text-[#58a700] dark:text-[#9be66e]"
            aria-hidden="true"
          />
        </span>
      }
      title="Learner interest"
      subtitle="Courses ranked by demand"
    />
  );
}

function EditorRootMobileHeader() {
  return (
    <MobileEditorHeader
      backHref="/"
      backLabel="Back to stories"
      icon={
        <span className="grid w-8 shrink-0 place-items-center">
          <BookOpenIcon className="size-5" />
        </span>
      }
      title="Courses"
      subtitle="Editor"
    >
      <MobileEditorOptionsSheet
        title="Editor options"
        triggerLabel="More editor options"
      >
        <MobileEditorMenuLink href="/editor/feedback">
          Feedback
        </MobileEditorMenuLink>
        <MobileEditorMenuLink href="/editor/interest">
          Courses ranked by learner interest
        </MobileEditorMenuLink>
      </MobileEditorOptionsSheet>
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
          <CourseMobileHeaderIllustration
            learningLanguageId={sourceCourse.learningLanguageId}
            fromLanguageId={sourceCourse.fromLanguageId}
          />
        ) : undefined
      }
      title="Import stories"
      subtitle={`from ${fromId}`}
    />
  );
}

function CourseMobileHeader({ course }: { course: CourseProps }) {
  const { isPinned, isUpdating, isLoading, toggle } = useCoursePin(course.id);
  const courseIdentifier = course.short ?? course.id;

  return (
    <MobileEditorHeader
      backHref="/editor"
      backLabel="Back to editor"
      icon={
        <CourseMobileHeaderIllustration
          learningLanguageId={course.learningLanguageId}
          fromLanguageId={course.fromLanguageId}
        />
      }
      title={course.learning_language_name}
      subtitle={`from ${course.from_language_name}`}
    >
      <MobileEditorOptionsSheet
        title="Course options"
        triggerLabel="More course options"
      >
        <button
          type="button"
          aria-pressed={isPinned}
          disabled={isLoading || isUpdating}
          className={`${mobileEditorMenuItemClassName} disabled:cursor-wait disabled:opacity-50`}
          onClick={() => void toggle()}
        >
          <PinIcon
            className="size-5"
            fill={isPinned ? "currentColor" : "none"}
          />
          {isPinned ? "Unpin course" : "Pin course"}
        </button>
        {!course.official ? (
          <MobileEditorMenuLink
            href={`/editor/course/${courseIdentifier}/import/es-en`}
          >
            Import stories
          </MobileEditorMenuLink>
        ) : null}
        <MobileEditorMenuLink
          href={`/editor/course/${courseIdentifier}/feedback`}
        >
          Feedback
        </MobileEditorMenuLink>
        <MobileEditorMenuLink href={`/editor/course/${courseIdentifier}/stats`}>
          Course stats
        </MobileEditorMenuLink>
        <MobileEditorMenuLink
          href={`/editor/course/${courseIdentifier}/voices`}
        >
          Character voices
        </MobileEditorMenuLink>
        {course.from_language_name !== "English" ? (
          <MobileEditorMenuLink
            href={`/editor/course/${courseIdentifier}/localization`}
          >
            Localization
          </MobileEditorMenuLink>
        ) : null}
      </MobileEditorOptionsSheet>
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
