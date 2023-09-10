import {get_course_import, get_course_editor} from "../../../../db_get_course_editor";
import ImportList from "./import_list";


export default async function Page({params}) {
    let from = params.from_id;
    let course = await get_course_editor(params.course_id);

    let imports = await get_course_import(params);

    if(!imports) {
        imports = [];
    }

    // Render data...
    return <>
        <ImportList course={course} imports={imports} import_id={from} />!
    </>
}
