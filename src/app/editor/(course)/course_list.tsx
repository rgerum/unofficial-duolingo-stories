"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import LanguageFlag from "@/components/ui/language-flag";
import { useInput } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import type { CourseProps } from "./types";

interface CourseListProps {
  course_id: string | undefined;
  showList: boolean;
  toggleShow: () => void;
}

export default function CourseList({
  course_id,
  showList,
  toggleShow,
}: CourseListProps) {
  const data = useQuery(api.editorRead.getEditorSidebarData, {});
  const courses = data?.courses as CourseProps[] | undefined;

  const [search, setSearch] = useInput("");
  const router = useRouter();

  if (courses === undefined)
    return (
      <div className="[grid-area:nav] border-r border-[var(--header-border)] max-[1250px]:relative max-[1250px]:w-0">
        <Spinner />
      </div>
    );
  // Error loading courses
  if (courses.length === 0) {
    return (
      <div className="[grid-area:nav] border-r border-[var(--header-border)] max-[1250px]:relative max-[1250px]:w-0">
        Error loading courses
      </div>
    );
  }

  let filtered_courses: CourseProps[] = [];
  if (search === "") filtered_courses = courses;
  else {
    for (let course of courses) {
      if (
        course.learning_language_name
          .toLowerCase()
          .indexOf(search.toLowerCase()) !== -1
        //|| course.from_language_name.toLowerCase().indexOf(search.toLowerCase()) !== -1
      ) {
        filtered_courses.push(course);
      }
    }
  }

  return (
    <div
      className="group [grid-area:nav] border-r border-[var(--header-border)] max-[1250px]:relative max-[1250px]:w-0"
      data-show={!course_id ? true : showList}
    >
      <div
        className="pointer-events-none absolute h-full w-screen bg-black opacity-0 transition-opacity duration-500 ease-[ease] max-[1250px]:block max-[1250px]:group-data-[show=true]:pointer-events-auto max-[1250px]:group-data-[show=true]:opacity-50"
        onClick={() => toggleShow()}
      ></div>
      <div className="h-[calc(100vh-50px)] overflow-scroll max-[1250px]:absolute max-[1250px]:h-full max-[1250px]:w-[min(100vw,400px)] max-[1250px]:translate-x-[calc(-100%-10px)] max-[1250px]:bg-[var(--body-background)] max-[1250px]:shadow-[2px_19px_10px_hsl(20deg_10%_10%_/_0.5)] max-[1250px]:transition-transform max-[1250px]:duration-500 max-[1250px]:ease-in max-[1250px]:group-data-[show=true]:translate-x-0 max-[1250px]:group-data-[show=true]:duration-700 max-[1250px]:group-data-[show=true]:ease-out">
        <div className="sticky top-0 flex h-10 items-center border-b border-[var(--header-border)] bg-[var(--body-background)] pr-[10px]">
          <span className="px-[10px]">Search</span>
          <input
            className="mr-[10px] w-full rounded-2xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-[6px] py-[1px] text-[19px] text-[var(--text-color)]"
            value={search}
            onChange={setSearch}
          />
        </div>
        <div>
          {filtered_courses.map((course, index) => (
            <div key={index}>
              <Link
                className={
                  "flex items-center border-b border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color)] no-underline outline-offset-[-2px] hover:brightness-90 focus:brightness-90 " +
                  (course_id === course.short ? "brightness-90" : "")
                }
                href={`/editor/course/${course.short}`}
                onClick={() => {
                  router.push(`/editor/course/${course.short}`);
                  toggleShow();
                }}
              >
                <span className="w-[45px] text-right text-[var(--text-color-dim)]">
                  {course.count}
                </span>
                <LanguageFlag
                  className="m-1 ml-4"
                  languageId={course.learningLanguageId}
                  width={40}
                />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{`${
                  course.learning_language_name
                } [${course.from_language_short}] `}</span>
                <span className="grow whitespace-nowrap pr-[10px] text-right">
                  {course.todo_count ? (
                    <img
                      title={`This course has ${course.todo_count} TODOs.`}
                      alt="TODO"
                      src="/editor/icons/error.svg"
                    />
                  ) : null}
                  {course.official ? (
                    <span className="ml-[5px] h-7">
                      <img
                        src="https://d35aaqx5ub95lt.cloudfront.net/vendor/b3ede3d53c932ee30d981064671c8032.svg"
                        title="official"
                        alt="👑"
                      />
                    </span>
                  ) : course.contributors.length ? (
                    `🧑 ${course.contributors.length}`
                  ) : (
                    "💤"
                  )}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
