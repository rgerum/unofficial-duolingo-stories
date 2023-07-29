import {authOptions} from "pages/api/auth/[...nextauth]";
import {get_course_editor} from "pages/api/course/[course_id]";
import {getServerSession} from "next-auth/next";
import {notFound} from "next/navigation";
import EditList from "../../edit_list";


export default async function Page({params}) {

    const session = await getServerSession(authOptions);
    console.log("session", session)
    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session?.user?.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    let course = await get_course_editor(params.course_id);
    if(!course)
        notFound();

    //function sleep(ms) {
    //    return new Promise(resolve => setTimeout(resolve, ms));
    //}
    //await sleep(2000);

    return <EditList course={course} />
}
