import {Suspense} from "react";
import { cache } from 'react'
import {query_one_obj} from "lib/db";

import CourseTitle from "./course_title";
import SetList from "./set_list";
import {notFound} from "next/navigation";


const get_course = cache(async (course_id) => {
    return await query_one_obj(`
        SELECT l.name AS learningLanguageName FROM course
        JOIN language l on l.id = course.learningLanguage
        WHERE course.short = ? AND course.public = 1 LIMIT 1
        `, [course_id]);
})


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