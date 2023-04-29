import Link from "next/link";
import Flag from "../../layout/flag";
import styles from "./course_list.module.css"
import {useInput} from "../../../lib/hooks";


export default function CourseList({courses, course_id, showList}) {
    const [search, setSearch] = useInput("");

    if(courses === undefined)
        return <div className={styles.languages}><Spinner/></div>;
    // Error loading courses
    if(courses.length === 0){
        return <div className={styles.languages}>Error loading courses</div>;
    }

    let filtered_courses = [];
    if(search === "")
        filtered_courses = courses;
    else {
        for(let course of courses) {
            if(course.learningLanguageName.toLowerCase().indexOf(search.toLowerCase()) !== -1
                //|| course.fromLanguageName.toLowerCase().indexOf(search.toLowerCase()) !== -1
            ) {
                filtered_courses.push(course);
            }
        }
    }

    //console.log("courses", courses);var(--body-background-faint)
    return <div className={styles.languages} data-show={showList}>
        <div className={styles.search}><span>Search</span>
            <input value={search} onChange={setSearch}/>
        </div>
        <div className={styles.languagesScroll}>
            {filtered_courses.map((course, index) =>
                <div key={index}>
                    <Link className={styles.course_selection_button + " " + (course_id === course.id ? styles.course_selection_button_active : "")}
                          href={`/editor/course/${course.id}`}
                    >
                        <span className={styles.course_count}>{course.count}</span>
                        <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} style={{margin: "3px"}}/>
                        <span>{`${course.learningLanguageName} [${course.fromLanguage}]`}</span>
                        {course.official ? <span className={styles.crown}><img src="https://d35aaqx5ub95lt.cloudfront.net/vendor/b3ede3d53c932ee30d981064671c8032.svg" title="official" alt={"official"}/></span> : null}
                    </Link>
                </div>
            )}
        </div>
    </div>
}