import "./course-editor.css"
import React, {useState} from 'react';
import {useDataFetcher, useDataFetcher2} from 'includes'
import {Spinner, SpinnerBlue, Flag} from 'ui_elements'
import {LoggedInButton} from 'login'
import {getCourses, getCourse, getImportList, setImport, setApproval} from "./api_calls.mjs";
import {Link, useNavigate, useParams,} from "react-router-dom";


function CourseList({courses, course_id}) {
    if(courses === undefined)
        return <div id="languages"><Spinner/></div>;
    // Error loading courses
    if(courses.length === 0){
        return <div id="languages">Error loading courses</div>;
    }
    return <div id="languages">
        {courses.map((course, index) =>
            <div key={index}>
                <Link className={"course_selection_button" + (course_id === course.id ? " course_selection_button_active" : "")}
                   to={`/course/${course.id}`}
                >
                    <span className="course_count">{course.count}</span>
                    <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile}/>
                    <span>{`${course.learningLanguageName} [${course.fromLanguage}]`}{course.official ? <img src="https://d35aaqx5ub95lt.cloudfront.net/vendor/b3ede3d53c932ee30d981064671c8032.svg" title="official" alt={"official"}/> : null}</span>
                </Link>
            </div>
        )}
    </div>
}

function ImportList({course, import_id}) {
    const [courseImport, ] = useDataFetcher2(getImportList, [import_id, course?.id]);
    const [importing, setImporting] = useState(false);
    let navigate = useNavigate();

    async function do_import(id) {
        // prevent clicking the button twice
        if(importing) return
        setImporting(id);

        let id2 = await setImport(id, course.id);
        navigate("/story/"+id2);
    }

    if(course === undefined)
        return <></>

    // when there was an error loading
    if(courseImport && courseImport.length === 0)
        return <>Error loading.</>
    return courseImport ?
        <>
            {import_id === 12 ?
                <div>Importing from Spanish (from English). <Link to={`/course/${course.id}/import/66`}>switch to
                    English (from Spanish)</Link></div> :
                <div>Importing from English (from Spanish). <Link to={`/course/${course.id}/import/12`}>switch to
                    Spanish (from English)</Link></div>
            }
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

    return <div className="status_field">
        {<span className={"status_text"}>{status_wrapper(status, props.public)}</span>} {loading === 1 ? <SpinnerBlue /> :
        loading ===-1 ? <img title="an error occurred" alt="error" src="/icons/error.svg"/> : <></>}
        {props.official ? <></> : <span className="approval" onClick={addApproval}>
        {"👍 "+count}
    </span>}
        </div>
}

function formatDate(datetime) {
    function pad(x) {
        if(x < 10)
            return "0"+x;
        return x;
    }
    let d = new Date(datetime);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function EditList({course, updateCourses}) {
    let stories = course?.stories
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
                <th data-js-sort-colnum="6">Author</th>
                <th data-js-sort-colnum="7">Change</th>
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
                    <td><DropDownStatus id={story.id} count={story.approvals} status={story.status} public={story.public} official={course.official} updateCourses={updateCourses}/></td>
                    <td>{story.username}</td>
                    <td>{formatDate(story.date)}</td>
                    <td>{story.author_change}</td>
                    <td>{formatDate(story.change_date)}</td>
                </tr>
            )}
            </tbody>
        </table>
        {course ? <></> : <Spinner/>}
        {course && course?.stories === undefined ? <>Error loading.</> : <></>}
    </>
}


export function EditorOverview({userdata}) {
    let { id, import_id } = useParams();
    import_id = parseInt(import_id);
    let course_id = parseInt(id);

    const courses = useDataFetcher(getCourses);
    const [index, setCourseUpdateIndex] = useState(0);
    const [course, ] = useDataFetcher2(getCourse, [course_id, index]);

    const updateCourses = () => setCourseUpdateIndex(index+1);

    return <>
        <div id="toolbar">
            <CourseEditorHeader userdata={userdata} courses={courses} course_id={course_id} import_id={import_id} />
        </div>
        <div id="root">
            <CourseList courses={courses} course_id={course_id} />
            <div id="main_overview">
                { course_id && import_id ?
                    <ImportList course={course} import_id={import_id}/>
                  : course_id ?
                    <EditList course={course} updateCourses={updateCourses} />
                  :
                    <p id="no_stories">Click on one of the courses to display its stories.</p>
                }
            </div>
        </div>
    </>
}


export function CourseEditorHeader({courses, course_id, userdata, import_id}) {
    let course = undefined;
    if(courses) {
        for (let c of courses) {
            if(c.id === course_id) {
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
            !import_id ?
            <Link id="button_import" className="editor_button" to={`/course/${course.id}/import/12`}
                style={{marginLeft: "auto"}} data-cy="button_import">
                <div><img alt="import button" src="/icons/import.svg"/></div>
                <span>Import</span>
            </Link> :
            <Link id="button_back" className="editor_button" to={`/course/${course.id}`}
                style={{marginLeft: "auto"}} data-cy="button_back">
                <div><img alt="back button" src="/icons/back.svg"/></div>
                <span>Back</span>
            </Link>
        }
        <LoggedInButton userdata={userdata} page="editor"/>
    </div></>
}
