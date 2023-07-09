import styles from "./course_list.module.css"
import LanguageButton from "./language_button";

export default function CourseList({courses}) {
    return <>{Object.entries(courses).map(([name,]) => (
        <div className={styles.course_list} key={name}>
            <hr/>
            <div className={styles.course_group_name}>Stories for {name} Speakers</div>
            {courses[name].map(course => (
                <LanguageButton key={course.id} course={course} />
            ))}
        </div>
    ))
    }</>
}
