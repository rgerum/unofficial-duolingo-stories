import Link from "next/link";
import Flag from "./flag";
import styles from "./language_button.module.css"

export default function LanguageButton({course}) {
    return <Link
        data-cy={"language_button_big_"+course.short}
        className={styles.language_select_button}
        href={`/${course.learningLanguage}-${course.fromLanguage}`}
    >
        <Flag iso={course.learningLanguage} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />

        <span className={styles.language_select_button_text}>{course.name}</span>
        <span className={styles.language_story_count}>{course.count} stories</span>
        {course.conlang ? <span className={styles.conlang}>conlang</span> : <></>}
    </Link>;
}