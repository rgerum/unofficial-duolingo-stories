import Link from "next/link";
import {useState} from "react";
import styles from "./edit_list.module.css"
import {SpinnerBlue} from "../../layout/spinner";
import {useRouter} from "next/router";

export async function setImport(id, course_id) {
    let response_json = await fetch(`/api/editor/set_import/${course_id}/${id}`, {credentials: 'include'});
    let data = await response_json.json();
    return data.id;
}

export default function ImportList({course, imports, import_id}) {
    let stories = course?.stories;
    const [importing, setImporting] = useState(false);
    let router = useRouter();

    async function do_import(id) {
        // prevent clicking the button twice
        if(importing) return
        setImporting(id);

        let id2 = await setImport(id, course.id);
        await router.push("/editor/story/"+id2);
    }

    if(stories === undefined)
        stories = []
    let set_ends = [];
    let last_set = 1;
    for(let story of stories) {
        if(story.set_id === last_set)
            set_ends.push(0);
        else
            set_ends.push(1);
        last_set = story.set_id;
    }
    return <>
        {(import_id === "12" || import_id === "es-en") ?
            <div>Importing from Spanish (from English). <Link href={`/editor/course/${course.short}/import/en-es-o`}>switch to
                English (from Spanish)</Link></div> :
            <div>Importing from English (from Spanish). <Link href={`/editor/course/${course.short}/import/es-en`}>switch to
                Spanish (from English)</Link></div>
        }
        <table className={styles.story_list + " js-sort-table js-sort-5 js-sort-desc"} data-cy="story_list" data-js-sort-table="true">
            <thead>
            <tr>
                <th data-js-sort-colnum="0">Set</th>
                <th style={{width: "100%"}} colSpan="2" data-js-sort-colnum="1">Name</th>
                <th data-js-sort-colnum="5" className="js-sort-active">Copies</th>
            </tr>
            </thead>
            <tbody>
            {imports.map((story, i) =>
                <tr key={story.id} className={set_ends[i] ? styles.set_start : ""}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="44px"><img alt={"story title"}
                                          src={story.copies ? story.image_done : story.image}
                                          width="44px" height={"40px"}/></td>
                    <td style={{width: "100%"}}>
                        {importing === story.id ?
                            <span>Importing <SpinnerBlue/></span>
                            : <a href={`#`} title={story.duo_id} onClick={() => do_import(story.id)}>{story.name}</a>
                        }</td>
                    <td>{story.copies}x</td>
                </tr>
            )}
            </tbody>
        </table>
        {course ? <></> : <></>}
        {course && course?.stories === undefined ? <>Error loading.</> : <></>}
    </>
}

function pad(x) {
    if(x < 10)
        return "0"+x;
    return x;
}

export async function setApproval(data) {
    let response = await fetch(`/api/editor/approve/${data.story_id}`);
    return await response.json();
}
