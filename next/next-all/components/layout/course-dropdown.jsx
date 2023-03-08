import styles from "./course-dropdown.module.css";
import Link from "next/link";
import Flag from "./flag";
import Dropdown from "./dropdown";
import {useUserCourses} from "../../lib/hooks";



function LanguageButtonSmall({course}) {
    /**
     * A button in the language drop down menu (flag + name)
     */
    return <Link
        className={styles.language_select_item}
        href={`/${course.learningLanguage}-${course.fromLanguage}`}
    >
        <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />
        <span>{course.name || course.learningLanguageName}</span>
    </Link>;
}

export default function CourseDropdown({course}) {
    const course_data = useUserCourses();

    if(!course_data || course_data?.length === 0)
        return <div></div>

    return <Dropdown>
        <Flag iso={course?.learningLanguage} width={40} flag={course?.learningLanguageFlag} flag_file={course?.learningLanguageFlagFile}/>
        <nav className={styles.header_lang_selector}>
        {course_data.map(course => (
            <LanguageButtonSmall key={course.id} course={course} />
        ))}
        </nav>
    </Dropdown>

}