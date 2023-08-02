import Link from "next/link";
import { cache } from 'react'
import {query_one_obj} from "lib/db";

import Header from "./header";
import CourseList from "./course_list";


export const get_counts = cache(async () => {
    return await query_one_obj(`SELECT COUNT(DISTINCT course.id) AS count_courses, COUNT(DISTINCT story.id) as count_stories FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1 LIMIT 1`);
})


export default async function Page({ }) {
    const counts = await get_counts();

    // Render data...
    return <>
        <Header>
            <h1>Unofficial Duolingo Stories</h1>
            <p>
                A community project to bring the original <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link> to new languages.
                <br/>{counts.count_stories} stories in {counts.count_courses} courses and counting!
            </p>
            <p>
                If you want to contribute or discuss the stories, meet us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link><br/>
                or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
            </p>
        </Header>
        <div>
            <CourseList/>
        </div>
    </>
}
