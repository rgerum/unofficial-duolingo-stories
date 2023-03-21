import Link from "next/link";
import {useState} from "react";
import styles from "./edit_list.module.css"


export default function EditList({course, updateCourses}) {
    let stories = course?.stories
    console.log("course", course);
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
        <div>
            <ul>
                <li>To create a new story click the "Import" button. The story starts as "✍️ draft".</li>
                <li>When you have finished working on the story,
                    click the "👍" icon to approve it and change the status to "🗨 feedback".</li>
                <li>
                    Now tell contributors on Discord to check the story.
                    When one or more people have checked the story and also gave their approval "👍" the status changes to "✅  finished".
                </li>
                <li>
                    When one complete set is finished it will switch to "📢 published".
                </li>
            </ul>

        </div>
        <table className={styles.story_list + " js-sort-table js-sort-5 js-sort-desc"} data-cy="story_list" data-js-sort-table="true">
            <thead>
            <tr>
                <th data-js-sort-colnum="0">Set</th>
                <th style={{width: "100%"}} colSpan="2" data-js-sort-colnum="1">Name</th>
                <th data-js-sort-colnum="2">Status</th>
                <th data-js-sort-colnum="4">Author</th>
                <th data-js-sort-colnum="5" className="js-sort-active">Creation</th>
                <th data-js-sort-colnum="6">Author</th>
                <th data-js-sort-colnum="7">Change</th>
            </tr>
            </thead>
            <tbody>
            {stories.map((story, i) =>
                <tr key={story.id} className={set_ends[i] ? styles.set_start : ""}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="44px"><img alt={"story title"}
                                          src={"https://stories-cdn.duolingo.com/image/" + story.image + ".svg"}
                                          width="44px" height={"40px"}/></td>
                    <td style={{width: "100%"}}><Link href={`/story/${story.id}`}>{story.name}</Link></td>
                    <td><DropDownStatus id={story.id} count={story.approvals} status={story.status} public={story.public} official={course.official} updateCourses={updateCourses}/></td>
                    <td>{story.username}</td>
                    <td>{formatDate(story.date)}</td>
                    <td>{story.author_change}</td>
                    <td>{formatDate(story.change_date)}</td>
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

function formatDate(datetime) {
    let d = new Date(datetime);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function setApproval(data) {
    let response = await fetch(`/api/editor/approve/${data.story_id}`);
    return await response.json();
}

function DropDownStatus(props) {

    let [loading, setLoading] = useState(0);
    let [status, set_status] = useState(props.status);
    let [count, setCount] = useState(props.count);

    if(props.official)
        return <></>

    async function addApproval() {
        setLoading(1);
        try {
            let response = await setApproval({story_id: props.id});
            if (response?.count !== undefined) {
                let count = parseInt(response.count)
                setCount(count)
                if (response.published.length)
                    props.updateCourses();
                set_status(response.story_status);
                setLoading(0);
            }
        }
        catch (e) {
            console.error(e);
            return setLoading(-1);
        }
    }

    function status_wrapper(status, public_) {
        if(props.official)
            return "🥇 official"
        if(public_)
            return "📢 published"
        if(status === "draft")
            return "✍️ draft"
        if(status === "finished")
            return "✅ finished"
        if(status === "feedback")
            return "🗨️ feedback"
        if(status === "published")
            return "📢 published"
        return status
    }

    return <div className={styles.status_field}>
        {<span className={styles.status_text}>{status_wrapper(status, props.public)}</span>} {loading === 1 ? <SpinnerBlue /> :
        loading ===-1 ? <img title="an error occurred" alt="error" src="/icons/error.svg"/> : <></>}
        {props.official ? <></> : <span className={styles.approval} onClick={addApproval}>
        {"👍 "+count}
    </span>}
    </div>
}

function SpinnerBlue() {
    return <span>TODO</span>
}