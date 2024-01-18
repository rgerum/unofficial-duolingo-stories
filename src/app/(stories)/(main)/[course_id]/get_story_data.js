import { sql, cache } from "../../../../lib/db";
import { get_course } from "../get_course_data";

export const get_image_data = cache(
  async () => {
    let data = await sql`
SELECT id, active, gilded, active_lip, gilded_lip FROM image
`;
    let images = {};
    for (let d of data) {
      images[d.id] = d;
    }
    return images;
  },
  ["get_image_data"],
  { tags: ["image_data"] },
);

export async function get_image(id) {
  return (await get_image_data())[id];
}

export const get_story_data = cache(
  async () => {
    let image_data = await get_image_data();
    let data = await sql`
SELECT id, name, course_id, image, set_id, set_index
FROM
    story
WHERE
    public
ORDER BY
    course_id, set_id, set_index;
`;
    let courses_stories = {};
    for (let d of data) {
      if (!courses_stories[d.course_id]) courses_stories[d.course_id] = {};
      if (!courses_stories[d.course_id][d.set_id])
        courses_stories[d.course_id][d.set_id] = [];
      const image = image_data[d.image];
      d.active = image?.active;
      d.gilded = image?.gilded;
      d.active_lip = image?.active_lip;
      d.gilded_lip = image?.gilded_lip;
      courses_stories[d.course_id][d.set_id].push(d);
    }
    return courses_stories;
  },
  ["get_story_data"],
  { tags: ["story_data"] },
);

export async function get_course_sets(id) {
  const course = await get_course(id);
  return (await get_story_data())[course.id] || {};
}
