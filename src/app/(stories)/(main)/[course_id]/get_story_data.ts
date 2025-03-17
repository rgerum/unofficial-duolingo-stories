import { sql, cache } from "@/lib/db";
import { get_course } from "../get_course_data";

export interface ImageData {
  id: string;
  active: string;
  gilded: string;
  active_lip: string;
  gilded_lip: string;
}

export const get_image_data = cache(
  async () => {
    let data = await sql`
SELECT id, active, gilded, active_lip, gilded_lip FROM image
`;
    let images: Record<number, ImageData> = {};
    for (let d of data) {
      images[d.id] = d as ImageData;
    }
    return images;
  },
  ["get_image_data"],
  { tags: ["image_data"], revalidate: 3600 },
);

export async function get_image(id: number) {
  return (await get_image_data())[id];
}

export interface StoryData {
  id: number;
  name: string;
  course_id: number;
  image: string;
  set_id: number;
  set_index: number;
  active: string;
  gilded: string;
  active_lip: string;
  gilded_lip: string;
}

export const get_story_data = cache(
  async () => {
    let image_data = await get_image_data();
    let data = await sql`
SELECT id, name, course_id, image, set_id, set_index
FROM
    story
WHERE
    public AND not deleted
ORDER BY
    course_id, set_id, set_index;
`;
    let courses_stories: Record<string, Record<string, StoryData[]>> = {};
    for (let d of data) {
      if (!courses_stories[d.course_id]) courses_stories[d.course_id] = {};
      if (!courses_stories[d.course_id][d.set_id])
        courses_stories[d.course_id][d.set_id] = [];
      const image = image_data[d.image];
      d.active = image?.active;
      d.gilded = image?.gilded;
      d.active_lip = image?.active_lip;
      d.gilded_lip = image?.gilded_lip;
      courses_stories[d.course_id][d.set_id].push(d as StoryData);
    }
    return courses_stories;
  },
  ["get_story_data"],
  { tags: ["story_data"] },
);

export async function get_course_sets(id: string) {
  const course = await get_course(id);
  if (!course) return {};

  return (await get_story_data())[course.id] || {};
}
