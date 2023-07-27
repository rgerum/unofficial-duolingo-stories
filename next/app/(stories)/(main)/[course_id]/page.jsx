import {Suspense} from "react";

import CourseTitle from "./course_title";
import SetList from "./set_list";


/*
        <Head>
            <link rel="canonical" href={`https://www.duostories.org/${course.short}`} />
            <title>{`${course.learningLanguageName} Duolingo Stories`}</title>
            <meta name="description" content={`Improve your ${course.learningLanguageName} learning by community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`${course.learningLanguageName}, language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
 */
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