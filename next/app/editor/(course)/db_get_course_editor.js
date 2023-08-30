import { cache } from 'react'
import query, {query_objs} from "lib/db"


export const get_course_editor = cache(async (course_id) => {
    const isNumeric = value => value.length !== 0 && [...value].every(c => c >= '0' && c <= '9');
    let course_query;
    if(isNumeric(course_id)) {
        course_query = await query(`
        SELECT course.id, course.short, course.about, course.official,
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.id = ? LIMIT 1
        `, [course_id]);

        if (course_query.length === 0)
            return undefined;
    }
    else {
        course_query = await query(`
        SELECT course.id, course.short, course.about, course.official,
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.short = ? LIMIT 1
        `, [course_id]);

        if (course_query.length === 0)
            return undefined;
    }
    const course = Object.assign({}, course_query[0]);

    const res = await query(`SELECT COUNT(sa.id) as approvals, story.id, story.set_id, story.set_index, story.name, story.status, story.image,
       story.image_done, story.xp, story.name_base, user.username, user2.username AS author_change, story.date, story.change_date, story.public
    FROM story
    LEFT JOIN user ON story.author = user.id
    LEFT JOIN user user2 ON story.author_change = user2.id
    LEFT JOIN story_approval sa on story.id = sa.story_id
    WHERE story.course_id = ? AND deleted = false
    GROUP BY story.id
    ORDER BY story.set_id, story.set_index;`, [course.id]);
    //if(res.length === 0)
    //    return {error: "no stories"};

    let stories = [];
    for(let r of res) {
        r = {...r};
        r.date = `${r.date}`;
        r.change_date = `${r.change_date}`;
        stories.push(r);
    }

    let res2 = await query(`
    SELECT c.short, u.id, u.username, MAX(sa.date) as last_date,
       MAX(sa.date) > CURRENT_DATE() - INTERVAL 1 MONTH AS active
FROM course c
    JOIN story s on c.id = s.course_id
    JOIN story_approval sa on s.id = sa.story_id
    JOIN user u on u.id = sa.user_id WHERE course_id = ? GROUP BY user_id, c.id ORDER BY last_date DESC    
    `, [course.id])

    let contributors = [];
    for(let r of res2) {
        r = {...r};
        r.last_date = `${r.last_date}`;
        contributors.push(r);
    }

    return {...course, stories: stories, contributors: contributors};
})


export async function get_course_import({course_id, from_id}) {
    const isNumeric = value => value.length !== 0 && [...value].every(c => c >= '0' && c <= '9');

    if(!isNumeric(course_id)) {
        let q = await query(`
        SELECT course.id FROM course 
        WHERE course.short = ? LIMIT 1
        `, [course_id]);
        if (q.length === 0)
            return undefined;
        course_id = q[0].id;
    }
    if(!isNumeric(from_id)) {
        let q = await query(`
        SELECT course.id FROM course 
        WHERE course.short = ? LIMIT 1
        `, [from_id]);
        if (q.length === 0)
            return undefined;
        from_id = q[0].id;
    }

    let courses = await query(`SELECT s1.id, s1.set_id, s1.set_index, s1.name, image.gilded AS image_done, image.active AS image, COUNT(s2.id) copies
                      FROM story s1
                      LEFT JOIN (SELECT s2.duo_id, s2.id FROM story s2 WHERE s2.course_id = ?) AS s2 ON s1.duo_id = s2.duo_id
                      JOIN image on image.id = s1.image
                      WHERE s1.course_id = ? AND s1.deleted = 0
                      GROUP BY s1.id
                      ORDER BY s1.set_id, s1.set_index`, [course_id, from_id]);
    return courses.map((d) => {return {...d}});
}



export const get_courses_ungrouped = cache(async () => {
    let courses = await query_objs(`
SELECT course.id,  COALESCE(NULLIF(course.name, ''), l2.name) as name, course.short,
 l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
 l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
 COUNT(story.id) count, course.public, course.official, course.conlang FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN (SELECT * FROM story WHERE story.deleted = 0 AND story.public = 1) as story ON (course.id = story.course_id)
GROUP BY course.id
ORDER BY count DESC, fromLanguageName;
    `);
    let counts = await query_objs(`SELECT c.short, COUNT(DISTINCT(sa.user_id)) as count FROM course c JOIN story s on c.id = s.course_id
    JOIN story_approval sa on s.id = sa.story_id
                                                            WHERE
                                                            sa.date > CURRENT_DATE() - INTERVAL 1 MONTH
                                                            GROUP BY c.id`);
    for(let c of courses) {
        for(let c2 of counts) {
            if(c.short === c2.short)
                c.contributor_count = c2?.count;
        }
    }
    return courses;
})
