import React, {useState} from 'react';
import {useDataFetcher, useDataFetcher2} from 'story-component'
import {Spinner, SpinnerBlue} from 'story-component'
import {Flag, LoggedInButton} from 'story-component'
import {getCourses, getCourse, getImportList, setImport, setStatus, setApproval} from "./api_calls.mjs";
import "./course-editor.css"
import {Link, useNavigate, useParams,} from "react-router-dom";


function CourseList(props) {
    const courses = props.courses;
    if(courses === undefined)
        return <div id="languages"><Spinner/></div>;
    return <div id="languages">
        {courses.map((course, index) =>
            <div key={index}>
                <Link className={"course_selection_button" + (props.course_id === course.id ? " course_selection_button_active" : "")}
                   to={`/course/${course.id}`}
                >
                    <span className="course_count">{course.count}</span>
                    <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile}/>
                    <span>{`${course.learningLanguageName} [${course.fromLanguage}]`}</span>
                </Link>
            </div>
        )}
    </div>
}

function ImportList(props) {
    let course = props.course;
    const [courseImport, ] = useDataFetcher2(getImportList, [12, course.id]);
    const [importing, setImporting] = useState(false);
    let navigate = useNavigate();

    async function do_import(id) {
        // prevent clicking the button twice
        if(importing) return
        setImporting(id);
        console.log("do_import", id, course.id);
        let id2 = await setImport(id, course.id);
        console.log(id2, "?story="+id2);
        navigate("/story/"+id2);
    }
    return courseImport ?
        <>
        <div>Importing from Spanish (from English).</div>
        <table id="story_list" data-cy="import_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th data-js-sort-colnum="0">Set</th>
                <th colSpan="2" data-js-sort-colnum="1">Name</th>
                <th style={{textAlign: "center"}} data-js-sort-colnum="7">Copies</th>
                <th data-js-sort-colnum="8" />
            </tr>
            </thead>
            <tbody>
            {courseImport.map(story =>
                <tr key={story.id}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="44px"><img alt={"story title"} src={story.copies ? story.gilded : story.active} width="44px" /></td>
                    <td>
                        {importing === story.id ?
                            <span>Importing <SpinnerBlue/></span>
                            : <a href={`#`} title={story.duo_id} onClick={() => do_import(story.id)}>{story.name}</a>
                        }
                    </td>
                    <td style={{textAlign: "right"}}><span>{story.copies}x&nbsp;</span>

                    </td>
                    <td style={{textAlign: "right"}}>
                    </td>
                </tr>
            )}
            </tbody>
        </table>
        </>
        :
        <Spinner/>
}

function pad(x) {
    if(x < 10)
        return <><>&nbsp;</><>{x}</></>;
    return x;
}

function DropDownStatus(props) {

    let [loading, setLoading] = useState(0);
    let [status, set_status] = useState(props.status);
    let [count, setCount] = useState(props.count);

    if(props.official)
        return <></>

    async function addApproval() {
        let text = await setApproval({story_id: props.id});
        if(text !== undefined) {
            let count = parseInt(text)
            setCount(count)
            if(count === 0)
                changeState("draft");
            if(count === 1)
                changeState("feedback");
            if(count >= 2)
                changeState("finished");
        }
    }

    async function changeState(status) {
        setLoading(1);
        try {
            await setStatus({id: props.id, status: status})
        }
        catch (e) {
            console.error(e);
            return setLoading(-1);
        }
        set_status(status);
        setLoading(0);
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

    return <div className="status_field">
        {<span className={"status_text"}>{status_wrapper(status, props.public)}</span>} {loading === 1 ? <SpinnerBlue /> :
        loading ===-1 ? <img title="an error occurred" alt="error" src="/icons/error.svg"/> : <></>}
        {props.official ? <></> : <span className="approval" onClick={addApproval}>
        {"👍 "+count}
    </span>}
        </div>
}

function EditList(props) {
    let course = props.course;
    let stories = props.course?.stories
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
        <table id="story_list" data-cy="story_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th data-js-sort-colnum="0">Set</th>
                <th style={{width: "100%"}} colSpan="2" data-js-sort-colnum="1">Name</th>
                <th data-js-sort-colnum="2">Status</th>
                <th data-js-sort-colnum="4">Author</th>
                <th data-js-sort-colnum="5" className="js-sort-active">Creation</th>
                <th data-js-sort-colnum="6">Change</th>
            </tr>
            </thead>
            <tbody>
            {stories.map((story, i) =>
                <tr key={story.id} className={set_ends[i] ? "set_start" : ""}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="44px"><img alt={"story title"}
                        src={"https://stories-cdn.duolingo.com/image/" + story.image + ".svg"}
                        width="44px" height={"40px"}/></td>
                    <td style={{width: "100%"}}><Link to={`/story/${story.id}`}>{story.name}</Link></td>
                    <td><DropDownStatus id={story.id} count={story.approvals} status={story.status} public={story.public} official={props.course.official}/></td>
                    <td>{story.username}</td>
                    <td>{story.date}</td>
                    <td>{story.change_date}</td>
                </tr>
            )}
            </tbody>
        </table>
        {course ? <></> : <Spinner/>}
    </>
}


export function EditorOverview(props) {
    let { id } = useParams();
    let course_id = parseInt(id);

    const courses = useDataFetcher(getCourses);
    const [course, ] = useDataFetcher2(getCourse, [course_id]);

    const [showImport, do_setShowImport] = React.useState(false);

    function doSetCourse(course_new) {
        if(showImport)
            do_setShowImport(false);
        if(course_new === course_id) {
            return
        }

        setCourseID(course_new);
        setCourseIdSelected(course_new);
    }

    return <>
        <div id="toolbar">
            <CourseEditorHeader username={props.username} doLogout={props.doLogout} courses={courses} course_id={course_id} showImport={showImport} do_setShowImport={do_setShowImport} />
        </div>
        <div id="root">
            <CourseList courses={courses} course_id={course_id} setCourse={doSetCourse}/>
            <div id="main_overview">
                { course_id && showImport ?
                    <ImportList course={course}/>
                  : course_id ?
                    <EditList course={course}/>
                  :
                    <p id="no_stories">Click on one of the courses to display its stories.</p>
                }
            </div>
        </div>
    </>
}


export function CourseEditorHeader(props) {
    let courses = props.courses;
    let course = undefined;
    if(courses) {
        for (let c of courses) {
            if(c.id === props.course_id) {
                course = c;
                break;
            }
        }
    }

    if(!course || course.fromLanguageName === undefined)
        return <><div className="AvatarEditorHeader">
            <b>Course-Editor</b>
        </div></>
    return <><div className="AvatarEditorHeader">
        <b>Course-Editor</b>
        <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile}/>
        <Flag iso={course.fromLanguage} width={40*0.9} className={"flag_sub"} flag={course.fromLanguageFlag} flag_file={course.fromLanguageFlagFile}/>
        <span className={"AvatarEditorHeaderFlagname"} data-cy="course-title">{`${course.learningLanguageName} (from ${course.fromLanguageName})`}</span>
        {course.official ? <span data-cy="label_official"><i>official</i></span> :
            !props.showImport ?
            <div id="button_import" className="editor_button" onClick={() => props.do_setShowImport(1)}
            style={{marginLeft: "auto"}} data-cy="button_import">
            <div><img alt="import button" src="/icons/import.svg"/></div>
            <span>Import</span>
            </div> :
            <div id="button_back" className="editor_button" onClick={() => props.do_setShowImport(0)}
            style={{marginLeft: "auto"}} data-cy="button_back">
            <div><img alt="back button" src="/icons/back.svg"/></div>
            <span>Back</span>
            </div>
        }
        <LoggedInButton username={props.username} doLogout={props.doLogout}/>
    </div></>
}
