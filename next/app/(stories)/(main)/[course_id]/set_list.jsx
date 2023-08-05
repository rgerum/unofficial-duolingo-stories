import styles from "./set_list.module.css"
import StoryButton from "./story_button";
import query from "lib/db";
import {query_one_obj, query_objs} from "lib/db";
import {notFound} from "next/navigation";
import {cache} from "react";
import SetListClient from "./set_list_client";

export const get_course_done = async (course_id, username) => {
    const done_query = await query(`SELECT s.id FROM story_done JOIN story s on s.id = story_done.story_id WHERE user_id = (SELECT id FROM user WHERE username = ?) AND s.course_id = (SELECT id FROM course WHERE short = ?) GROUP BY s.id`, [username, course_id]);
    const done = {}
    for(let d of done_query) {
        done[d.id] = true;
    }

    return done;
}

export const get_course = cache(async (course_id) => {
    const course = await query_one_obj(`
        SELECT course.id, course.short, course.about, 
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.short = ? LIMIT 1
        `, [course_id]);

    if(!course)
        return undefined;

    const res = await query_objs(`
        SELECT story.id, story.set_id, story.set_index, story.name,
        i.active, i.activeLip, i.gilded, i.gildedLip
        FROM story
        JOIN image i on story.image = i.id
        WHERE story.public = 1 AND story.deleted = 0 AND story.course_id = (SELECT c.id FROM course c WHERE c.short = ?)
        GROUP BY story.id
        ORDER BY set_id, set_index;
        `, [course_id]);
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
        sets[sets.length - 1].push(d);
    }

    let count = 0;
    for(let set of sets)
        count += set.length;

    return {...course, sets: sets, count: count};
})


export default async function SetList({course_id}) {
    if(!course_id) {
        return <div className={styles.story_list}>
            {[...Array(2)].map((d, i) => (
                <div key={i} className={styles.set_list}>
                    <div className={styles.set_title}>Set {i+1}</div>
                    {[...Array(4)].map((d, i) => (
                        <StoryButton key={i}  />
                    ))}
                </div>
            ))}
        </div>
    }

    const course = await get_course(course_id);
    if(!course)
        notFound();

    return <SetListClient course_id={course_id} course={course}/>
}
