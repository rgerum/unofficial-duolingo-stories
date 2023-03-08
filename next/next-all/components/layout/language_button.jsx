import Link from "next/link";
import Flag from "./flag";
import styles from "./language_button.module.css"

export default function LanguageButton(props) {
    let course = props.course;

    return <Link
        data-cy={"language_button_big_"+course.id}
        className={styles.language_select_button}
        href={`/${course.learningLanguage}-${course.fromLanguage}`}
    >
        <Flag iso={course.learningLanguage} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />

        <span className={styles.language_select_button_text}>{course.name}</span>
        <span className={styles.language_story_count}>{course.count} stories</span>
    </Link>;
}