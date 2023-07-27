import Link from "next/link";

import query from "lib/db";

import Header from "./header";
import CourseList from "./course_list";


async function get_counts() {
    let res = await query(`SELECT COUNT(DISTINCT course.id) AS count_courses, COUNT(DISTINCT story.id) as count_stories FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1`);
    return Object.assign({}, res[0]);
}


/*
<Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org" />
            <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
 */

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
