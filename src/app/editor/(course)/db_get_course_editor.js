import { cache } from "react";
import { sql } from "lib/db";

export const get_course_editor = cache(async (course_id) => {
  const isNumeric = (value) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
  let course_query;
  if (isNumeric(course_id)) {
    course_query = await sql`
        SELECT course.id, course.short, course.about, course.official,
        l1.short AS from_language, l1.name AS from_language_name, l1.flag_file AS from_language_flag_file, l1.flag AS from_language_flag,
        l2.short AS learning_language, l2.name AS learning_language_name, l2.flag_file AS learning_language_flag_file, l2.flag AS learning_language_flag
        FROM course
        LEFT JOIN language l1 ON l1.id = course.from_language
        LEFT JOIN language l2 ON l2.id = course.learning_language
        WHERE course.id = ${course_id} LIMIT 1
        `;

    if (course_query.length === 0) return undefined;
  } else {
    course_query = await sql`
        SELECT course.id, course.short, course.about, course.official,
        l1.short AS from_language, l1.name AS from_language_name, l1.flag_file AS from_language_flag_file, l1.flag AS from_language_flag,
        l2.short AS learning_language, l2.name AS learning_language_name, l2.flag_file AS learning_language_flag_file, l2.flag AS learning_language_flag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.from_language
        LEFT JOIN language l2 ON l2.id = course.learning_language
        WHERE course.short = ${course_id} LIMIT 1
        `;

    if (course_query.length === 0) return undefined;
  }
  const course = Object.assign({}, course_query[0]);

  const res = await sql`
SELECT 
    (SELECT COUNT(DISTINCT sa.id) FROM story_approval sa WHERE sa.story_id = story.id) AS approvals,
    story.id, 
    story.set_id, 
    story.set_index, 
    story.name, 
    story.status, 
    story.image,
    "user".username, 
    user2.username AS author_change, 
    story.date, 
    story.change_date, 
    story.public
FROM 
    story
LEFT JOIN "user" ON story.author = "user".id
LEFT JOIN "user" user2 ON story.author_change = user2.id
WHERE 
    story.course_id = ${course.id} AND deleted = false
ORDER BY 
    story.set_id, story.set_index;
`;
  //if(res.length === 0)
  //    return {error: "no stories"};

  let stories = [];
  for (let r of res) {
    r = { ...r };
    r.date = `${r.date}`;
    r.change_date = `${r.change_date}`;
    stories.push(r);
  }
  // date('now', '-1 month')
  let res2 = await sql`
SELECT
    c.short,
    u.id,
    u.username,
    MAX(sa.date) AS last_date,
    MAX(sa.date) > CURRENT_DATE - INTERVAL '1 month' AS active
FROM
    course c
JOIN
    story s ON c.id = s.course_id
JOIN
    story_approval sa ON s.id = sa.story_id
JOIN
    "user" u ON u.id = sa.user_id
WHERE
    course_id = ${course.id}
GROUP BY
    u.id, c.id, c.short, u.username
ORDER BY
    last_date DESC;   
    `;

  let contributors = [];
  for (let r of res2) {
    r = { ...r };
    r.last_date = `${r.last_date}`;
    contributors.push(r);
  }

  return { ...course, stories: stories, contributors: contributors };
});

export async function get_course_import({ course_id, from_id }) {
  const isNumeric = (value) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");

  if (!isNumeric(course_id)) {
    let q = await sql`
        SELECT course.id FROM course 
        WHERE course.short = ${course_id} LIMIT 1
        `;
    if (q.length === 0) return undefined;
    course_id = q[0].id;
  }
  if (!isNumeric(from_id)) {
    let q = await sql`
        SELECT course.id FROM course 
        WHERE course.short = ${from_id} LIMIT 1
        `;
    if (q.length === 0) return undefined;
    from_id = q[0].id;
  }

  let courses = await sql`
SELECT 
    s1.id, 
    s1.set_id, 
    s1.set_index, 
    s1.name, 
    image.gilded AS image_done, 
    image.active AS image, 
    COUNT(s2.id) AS copies
FROM 
    story s1
LEFT JOIN (
    SELECT 
        s2.duo_id, 
        s2.id 
    FROM 
        story s2 
    WHERE 
        s2.course_id = ${course_id}
) AS s2 ON s1.duo_id = s2.duo_id
JOIN 
    image ON image.id = s1.image
WHERE 
    s1.course_id = ${from_id} AND NOT s1.deleted
GROUP BY 
    s1.id, s1.set_id, s1.set_index, s1.name, image.gilded, image.active
ORDER BY 
    s1.set_id, s1.set_index;`;
  return courses.map((d) => {
    return { ...d };
  });
}

export const get_courses_ungrouped = cache(async () => {
  let courses = await sql`
SELECT
    course.id,
    COALESCE(NULLIF(course.name, ''), l2.name) as name,
    course.short,
    l1.short AS from_language,
    l1.name AS from_language_name,
    l1.flag_file AS from_language_flag_file,
    l1.flag AS from_language_flag,
    l2.short AS learning_language,
    l2.name AS learning_language_name,
    l2.flag_file AS learning_language_flag_file,
    l2.flag AS learning_language_flag,
    COUNT(story.id) count,
    course.public,
    course.official,
    course.conlang
FROM
    course
LEFT JOIN language l1 ON l1.id = course.from_language
LEFT JOIN language l2 ON l2.id = course.learning_language
LEFT JOIN (
    SELECT * FROM story
    WHERE NOT story.deleted AND story.public
) as story ON (course.id = story.course_id)
GROUP BY
    course.id, course.short, l1.short, l1.name, l1.flag_file, l1.flag, l2.short, l2.name, l2.flag_file, l2.flag, course.public, course.official, course.conlang
ORDER BY
    count DESC, l1.name;
    `;
  let counts =
    await sql`SELECT c.short, COUNT(DISTINCT(sa.user_id)) as count FROM course c JOIN story s on c.id = s.course_id
    JOIN story_approval sa on s.id = sa.story_id
                                                            WHERE
                                                            sa.date > CURRENT_DATE - INTERVAL '1 month'
                                                            GROUP BY c.id`;
  for (let c of courses) {
    for (let c2 of counts) {
      if (c.short === c2.short) c.contributor_count = c2?.count;
    }
  }
  return courses;
});
