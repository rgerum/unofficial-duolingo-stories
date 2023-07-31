import {Suspense} from "react";
import query from "lib/db";

import CourseTitle from "./course_title";
import SetList from "./set_list";
import {notFound} from "next/navigation";


async function get_course(course_id) {

    const course_query = await query(`SELECT l.name AS learningLanguageName FROM course
    JOIN language l on l.id = course.learningLanguage
  WHERE course.short = ?
        `, [course_id]);

    if(course_query.length === 0)
        return undefined;
    return Object.assign({}, course_query[0]);
}


export async function generateMetadata({ params, searchParams }, parent) {
    const course = await get_course(params.course_id);

    if(!course)
        notFound();

    const meta = await parent;

    return {
        title: `${course.learningLanguageName} Duolingo Stories`,
        description: `Improve your ${course.learningLanguageName} learning by community-translated Duolingo stories.`,
        alternates: {
            canonical: `https://duostories.org/${params.course_id}`,
        },
        keywords: [course.learningLanguageName, ...meta.keywords],
    }
}

export default async function Page({params}) {

    return <>
        <Suspense fallback={<CourseTitle />}>
             <CourseTitle course_id={params.course_id}/>
        </Suspense>

        <Suspense fallback={<SetList />}>
            <SetList course_id={params.course_id} />
        </Suspense>
        <hr/>
    </>
}