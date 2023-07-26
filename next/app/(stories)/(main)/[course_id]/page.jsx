import Link from 'next/link'

import SetList from "./set_list";
import MainTitle from "../main_title";
import TitleDesc from "../title_desc";
import query from "lib/db";

async function get_course(course_id, user_id) {

    const course_query = await query(`
        SELECT course.id, course.short, course.about, 
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.short = ? LIMIT 1
        `, [course_id]);

    if(course_query.length === 0)
        return undefined;
    const course = Object.assign({}, course_query[0]);

    const res = await query(`
        SELECT story.id, story.set_id, story.set_index, story.name, story_done.time as time,
        i.active, i.activeLip, i.gilded, i.gildedLip
        FROM story
        LEFT JOIN story_done ON story_done.story_id = story.id AND story_done.user_id = ?
        JOIN image i on story.image = i.id
        WHERE story.public = 1 AND story.deleted = 0 AND story.course_id = (SELECT c.id FROM course c WHERE c.short = ?)
        GROUP BY story.id
        ORDER BY set_id, set_index;
        `, [user_id, course_id]);
    if(res.length === 0)
        return {...course, sets: [], count: 0};

    // group into sets
    let set = -1;
    let sets = [];
    for(let d of res) {
        if (set !== d.set_id) {
            set = d.set_id;
            sets.push([]);
        }
        sets[sets.length - 1].push(Object.assign({}, d));
    }

    let count = 0;
    for(let set of sets)
        count += set.length;

    return {...course, sets: sets, count: count};
}

/*
        <Head>
            <link rel="canonical" href={`https://www.duostories.org/${course.short}`} />
            <title>{`${course.learningLanguageName} Duolingo Stories`}</title>
            <meta name="description" content={`Improve your ${course.learningLanguageName} learning by community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`${course.learningLanguageName}, language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
 */
export default async function Page({params}) {
    const course = await get_course(params.course_id);

    return <>
        <header>
            <MainTitle>Unofficial {course.learningLanguageName} Duolingo Stories</MainTitle>
            <TitleDesc>
                Learn {course.learningLanguageName} with {course.count} community translated Duolingo Stories.
            </TitleDesc>
            <TitleDesc>
                If you want to contribute or discuss the stories, meet us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link><br/>
                or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
            </TitleDesc>
        </header>

        <SetList course={course} />
        <hr/>
    </>
}