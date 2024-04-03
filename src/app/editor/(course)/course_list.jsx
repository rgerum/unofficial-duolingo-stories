"use client";
import Link from "next/link";
import Flag from "components/layout/flag";
import styles from "./course_list.module.css";
import { useInput } from "lib/hooks";
import { useRouter } from "next/navigation";
import { Spinner } from "../../../components/layout/spinner";

export default function CourseList({
  courses,
  languages,
  course_id,
  showList,
  toggleShow,
}) {
  const [search, setSearch] = useInput("");
  const router = useRouter();
  console.log(courses);

  if (courses === undefined)
    return (
      <div className={styles.languages}>
        <Spinner />
      </div>
    );
  // Error loading courses
  if (courses.length === 0) {
    return <div className={styles.languages}>Error loading courses</div>;
  }

  let filtered_courses = [];
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

  filtered_courses = [
    ...filtered_courses,
    ...filtered_courses,
    ...filtered_courses,
    ...filtered_courses,
    ...filtered_courses,
    ...filtered_courses,
  ];
  filtered_courses = [
    ...filtered_courses,
    ...filtered_courses,
    ...filtered_courses,
  ];

  return (
    <div className={styles.languages} data-show={!course_id ? true : showList}>
      <div className={styles.backdrop} onClick={() => toggleShow()}></div>
      <div className={styles.languages_wrapper}>
        <div className={styles.search}>
          <span>Search</span>
          <input value={search} onChange={setSearch} />
        </div>
        <div>
          {filtered_courses.map((course, index) => (
            <div key={index}>
              <Link
                className={
                  styles.course_selection_button +
                  " " +
                  (course_id === course.short
                    ? styles.course_selection_button_active
                    : "")
                }
                href={`/editor/course/${course.short}`}
                onClick={() => {
                  router.push(`/editor/course/${course.short}`);
                  toggleShow();
                }}
              >
                <span className={styles.course_count}>{course.count}</span>
                <Flag
                  iso={languages[course.learning_language].short}
                  width={40}
                  flag_file={languages[course.learning_language].flag_file}
                  style={{ margin: "3px" }}
                />
                <span className={styles.course_selection_course_name}>{`${
                  course.learning_language_name
                } [${languages[course.from_language].short}] `}</span>
                <span className={styles.author}>
                  {course.todo_count ? (
                    <img
                      title={`This course has ${course.todo_count} TODOs.`}
                      alt="TODO"
                      src="/editor/icons/error.svg"
                    />
                  ) : null}
                  {course.official ? (
                    <span className={styles.crown}>
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
