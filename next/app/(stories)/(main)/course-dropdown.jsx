'use client'
import styles from "./course-dropdown.module.css";
import Link from "next/link";
import Flag from "components/layout/flag";
import Dropdown from "components/layout/dropdown";
import {useSelectedLayoutSegment} from "next/navigation";


function LanguageButtonSmall({course}) {
    /**
     * A button in the language drop down menu (flag + name)
     */
    return <Link
        className={styles.language_select_item}
        href={`/${course.learningLanguage}-${course.fromLanguage}`}
        data-cy="button_lang_dropdown"
    >
        <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />
        <span>{course.name || course.learningLanguageName}</span>
    </Link>;
}


export default function CourseDropdown({all_courses_flags, course_data}) {
    const segment = useSelectedLayoutSegment()
    let course = all_courses_flags[segment];


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