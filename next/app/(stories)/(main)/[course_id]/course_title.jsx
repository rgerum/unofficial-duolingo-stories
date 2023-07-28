import Link from 'next/link'
import query from "lib/db";

import Header from "../header";

import styles from "./story_button.module.css"
import {notFound} from "next/navigation";


export async function get_course(course_id) {

    const course_query = await query(`SELECT l.name AS learningLanguageName, COUNT(course.id) AS count FROM course
    JOIN language l on l.id = course.learningLanguage
    JOIN story s on course.id = s.course_id
  WHERE course.short = ? AND s.public GROUP BY course.id
        `, [course_id]);

    if(course_query.length === 0)
        return undefined;
    return Object.assign({}, course_query[0]);
}

/*
        <Head>
            <link rel="canonical" href={`https://www.duostories.org/${course.short}`} />
            <title>{`${course.learningLanguageName} Duolingo Stories`}</title>
            <meta name="description" content={`Improve your ${course.learningLanguageName} learning by community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`${course.learningLanguageName}, language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
 */
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
        notFound();
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