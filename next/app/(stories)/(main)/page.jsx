import Link from "next/link";

import CourseList from "./course_list";
import MainTitle from "./main_title";
import TitleDesc from "./title_desc";
import query from "lib/db";


async function get_counts() {
    let res = await query(`SELECT COUNT(DISTINCT course.id) AS count_courses, COUNT(DISTINCT story.id) as count_stories FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1`);
    return Object.assign({}, res[0]);
}


async function get_courses() {
    let courses = await query(`
SELECT course.id,  COALESCE(NULLIF(course.name, ''), l2.name) as name, course.short,
 l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
 l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
 COUNT(story.id) count, course.public, course.official, course.conlang FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1
GROUP BY course.id
ORDER BY name;
    `);
    // sort courses by base language
    let base_languages = {};
    let languages = [];
    // iterate over all courses
    for (let course of courses) {
        // if base language not yet in list
        if (base_languages[course.fromLanguageName] === undefined) {
            // initialize the list
            base_languages[course.fromLanguageName] = [];
            // and add it to the list of all base languages (we will add English after sorting in the front)
            if (course.fromLanguageName !== "English")
                languages.push(course.fromLanguageName);
        }
        base_languages[course.fromLanguageName].push(Object.assign({}, course));
    }
    // sort the base languages and then add English as first (and most relevant)
    languages = languages.sort();
    // if we have english courses add "English" as the first entry
    if (base_languages["English"])
        languages.unshift("English");

    // create a new sorted
    let grouped_languages = {};
    for (let lang of languages) {
        grouped_languages[lang] = base_languages[lang];
    }

    return grouped_languages;
}

/*
<Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org" />
            <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function Page({ }) {
    const counts = await get_counts();

    let courses = await get_courses();

    let userdata = undefined;
    await sleep(2000);

    // Render data...
    return <>
        <header>
            <MainTitle>Unofficial Duolingo Stories</MainTitle>
            <TitleDesc>
                A community project to bring the original <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link> to new languages.
                <br/>{counts.count_stories} stories in {counts.count_courses} courses and counting!
            </TitleDesc>
            <TitleDesc>
                If you want to contribute or discuss the stories, meet us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link><br/>
                or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
            </TitleDesc>
        </header>
        <div>
            <CourseList courses={courses}/>
        </div>
    </>
}
