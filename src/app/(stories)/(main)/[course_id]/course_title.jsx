import Link from 'next/link'
import {cache} from "react";
import {query_one_obj} from "lib/db";

import Header from "../header";

import styles from "./story_button.module.css"


export const get_course = cache(async (course_id) => {
    return await query_one_obj(`
    SELECT l.name AS learningLanguageName, COUNT(course.id) AS count FROM course
    JOIN language l on l.id = course.learningLanguage
    JOIN story s on course.id = s.course_id
    WHERE s.public = 1 AND s.deleted = 0 AND course.short = ? GROUP BY course.id LIMIT 1
        `, [course_id]);
})

export default async function CourseTitle({course_id}) {
    if(!course_id) {
        return <>
            <Header>
                <h1><span className={styles.animated_background}>Unofficial Language Duolingo Stories</span></h1>
                <p>
                    <span className={styles.animated_background}>Learn Language with 000 community translated Duolingo Stories.</span>
                </p>
                <p>
                    <span className={styles.animated_background}>If you want to contribute or discuss the stories, meet us on Discord</span><br/>
                    <span className={styles.animated_background}>or learn more about the project in our FAQ.</span>
                </p>
            </Header>

        </>
    }
    const course = await get_course(course_id);
    if(!course)
        return <Header><h1>Course not found.</h1></Header>
        //notFound();
    /*
     */
    return <>
        <Header>
            <h1>Unofficial {course.learningLanguageName} Duolingo Stories</h1>
            <p>
                Learn {course.learningLanguageName} with {course.count} community translated Duolingo Stories.
            </p>
            <p>
                If you want to contribute or discuss the stories, meet us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link><br/>
                or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
            </p>
        </Header>

    </>
}