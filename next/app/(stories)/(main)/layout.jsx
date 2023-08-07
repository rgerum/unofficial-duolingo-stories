import Link from "next/link";
import React from "react";
import { cache } from 'react'
import {getServerSession} from "next-auth/next";
import Legal from "components/layout/legal";
import {query_objs} from "lib/db";
import styles from './layout.module.css'
import {authOptions} from "app/api/auth/[...nextauth]/route";
import CourseDropdown from "./course-dropdown";
import LoggedInButton, {LogInButton} from "components/login/loggedinbutton";


export const metadata = {
    title: 'Duostories: improve your Duolingo learning with community translated Duolingo stories.',
    description: 'Supplement your Duolingo course with community-translated Duolingo stories.',
    alternates: {
        canonical: 'https://duostories.org',
    },
    keywords: ['language', 'learning', 'stories', 'Duolingo', 'community', 'volunteers'],
};

export const get_courses_user = cache(async (user_name) => {
    // sort courses by base language
    return await query_objs(`
SELECT course.id, course.name,
 l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
 l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
 course.public, course.official, time FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
    INNER JOIN (SELECT s.course_id, story_done.id as sdid, MAX(story_done.time) as time FROM story s INNER JOIN story_done ON story_done.story_id = s.id 
    WHERE story_done.user_id = (SELECT id FROM user WHERE username = ? LIMIT 1) GROUP BY course_id) as ss on course.id = ss.course_id
     ORDER BY time DESC
    `, [user_name])
})

export const get_course_flags = cache(async () => {
    return await query_objs(`SELECT course.short, l.short AS learningLanguage, l.flag AS learningLanguageFlag, l.flag_file AS learningLanguageFlagFile FROM course JOIN language l on l.id = course.learningLanguage WHERE course.public`,
        [], "short");
})

export default async function Layout({children}) {
    // @ts-ignore
    let all_courses_flags = await get_course_flags();

    const session = await getServerSession(authOptions);

    let active_courses;
    if(session?.user?.name)
        active_courses = await get_courses_user(session.user.name)

    return (
            <>
            <nav className={styles.header_index}>
                <Link href={"/"} className={styles.duostories_title} data-cy={"logo"}>Duostories</Link>
                <div style={{marginLeft: "auto"}}></div>

                <CourseDropdown course_data={active_courses} all_courses_flags={all_courses_flags} />
                {(session?.user) ?
                    <LoggedInButton page={"stories"} course_id={undefined} session={session}/> :
                    <LogInButton/>
                }
            </nav>
            <div className={styles.main_index}>
                {children}
            </div>
            <Legal language_name={undefined} />
            </>
    );
}