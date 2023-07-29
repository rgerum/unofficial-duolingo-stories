import {language_list} from "pages/api/admin/set_language";
import {CourseTagList, CourseList} from "./courses";
import {course_list, course_tag_list} from "../../../pages/api/admin/set_course";


export default async function Page({}) {
    let courses = await course_list();
    let course_tags = await course_tag_list();
    let languages = await language_list();


    return <>
        <CourseTagList course_tags={course_tags} />
        <CourseList users={courses} languages={languages} course_tags={course_tags} />
    </>
}