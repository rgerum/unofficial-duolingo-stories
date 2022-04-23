import React from 'react';
import {useDataFetcher, useDataFetcher2, useEventListener} from './hooks'
import {Spinner} from './react/spinner'
import {Flag} from './react/flag'
import {useUsername, LoginDialog} from './login'
import {setPublic, getCourses, getCourse, getImportList, setImport} from "./api_calls.mjs";
import "./editor.css"


function CourseList(props) {
    const courses = useDataFetcher(getCourses);
    if(courses === undefined)
        return null;
    return <div id="languages">
        {courses.map((course, index) =>
            <div key={index}>
                <a className="course_selection_button"
                   href={`?course=${course.id}`}
                   onClick={(e) => {e.preventDefault(); props.setCourse(course.id);}}
                >
                    <span className="course_count">{course.count}</span>
                    <Flag flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile}/>
                    <span>{`${course.learningLanguageName} [${course.fromLanguage}]`}</span>
                </a>
            </div>
        )}
    </div>
}

function ImportList(props) {
    let course = props.course;
    const [courseImport, courseImportRefetch] = useDataFetcher2(getImportList, [12, course.id]);
    async function do_import(id) {
        console.log("do_impor", id, course.id);
        let id2 = await setImport(id, course.id);
        console.log(id2, "?story="+id2);
        window.location.href = "?story="+id2;
    }
    return courseImport ?
        <>
        <div>Importing from Spanish (from English).</div>
        <table id="story_list" style={{display: "inline-block"}} className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Set</th>
                <th colSpan="2" data-js-sort-colnum="1">Name</th>
                <th style={{textAlign: "center"}} data-js-sort-colnum="7">Copies</th>
                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="8" />
            </tr>
            </thead>
            <tbody>
            {courseImport.map(story =>
                <tr key={story.id}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="44px"><img alt={"story title"} src={story.copies ? story.gilded : story.active} width="44px" /></td>
                    <td><a href={`#`} title={story.duo_id} onClick={()=>do_import(story.id)}>{story.name}</a></td>
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

function EditList(props) {
    let course = props.course;
// TODO    document.getElementById('button_import').onclick = ()=>setShowImport(course.id)
    return <>
        <table id="story_list" style={{display: "inline-block"}}
               className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Set</th>
                <th colSpan="2" data-js-sort-colnum="1">Name</th>
                <th data-js-sort-colnum="4">Author</th>
                <th data-js-sort-colnum="5" className="js-sort-active">Creation</th>
                <th data-js-sort-colnum="6">Change</th>
                <th style={{textAlign: "center"}} data-js-sort-colnum="7">Done</th>
                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="8">Public</th>
            </tr>
            </thead>
            <tbody>
            {course.stories.map(story =>
                <tr key={story.id}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="44px"><img alt={"story title"}
                        src={"https://stories-cdn.duolingo.com/image/" + story.image + ".svg"}
                        width="44px"/></td>
                    <td><a href={`?story=${story.id}`}>{story.name}</a></td>
                    <td>{story.username}</td>
                    <td>{story.date}</td>
                    <td>{story.change_date}</td>
                    <td style={{textAlign: "right"}}><span>{story.count}x&nbsp;</span>

                    </td>
                    <td style={{textAlign: "right"}}>
                        <label className="switch" onClick={(e) => {
                            e.preventDefault();
                            togglePublic(story)
                        }}>
                            <input type="checkbox" checked={story.public ? "checked" : ""}
                                   readOnly="readOnly"/>
                            <span className="slider round"/>
                        </label>
                    </td>
                </tr>
            )}
            </tbody>
        </table>
    </>
}

function StoriesList(props) {
    let course = props.course;
    let showImport = props.showImport;
    console.log("StoriesList", course)
    return <>{
        course === undefined || course.stories === undefined ?
        <>
            <h1>Loading</h1>
            <Spinner/>
        </>
        : showImport ?
            <ImportList course={course}/>
        : <EditList course={course}/>
    }</>
}

function Overview(props) {
    let course = props.course;
    let course_id = props.course_id;

    return <>
        <CourseList setCourse={props.setCourse}/>
        <div id="main_overview">
            <div id="main_overview_container">
            { course_id ?
                <StoriesList course={course} showImport={props.showImport}/>
                :
                <><h1 id="title">Editor - Stories</h1>
                <p id="no_stories">Click on one of the courses to display its stories.</p>
                </>
            }
            </div>
        </div>
    </>
}

export function EditorOverviewLogin(props) {
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    // loading
    if (username === undefined) return <Spinner/>
    // no username show login
    console.log("username", username)
    if (username.username === undefined || username.role !== 1)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />
    // logged in and allowed!
    return <EditorOverview/>
}

export function EditorOverview(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [course_id, setCourseID] = React.useState(urlParams.get("course") || undefined);
    const [course, courseRefetch] = useDataFetcher2(getCourse, [course_id]);

    const [showImport, do_setShowImport] = React.useState(false);

    function doSetCourse(course_new) {
        if(course_new === course_id)
            return

        history.pushState({course: course_new}, "Language"+course_new, `?course=${course_new}`);
        setCourseID(course_new);
        courseRefetch();
    }

    useEventListener("popstate", (event) => {
        if(event.state.story)
            changeStory(event.state.story)
        else {
            if(event.state.course)
                setCourseID(event.state.course)
            else
                setCourseID(undefined)
        }
    })

    return <>
        <div id="toolbar">
            <CourseEditorHeader course={course} showImport={showImport} do_setShowImport={do_setShowImport} />
        </div>
        <div id="root">
            <Overview course_id={course_id} course={course} setCourse={doSetCourse} showImport={showImport}/>
        </div>
    </>
}


export function CourseEditorHeader(props) {
    let course = props.course;
    if(!props.course || props.course.fromLanguageName === undefined)
        return <><div className="AvatarEditorHeader">
            <b>Course-Editor</b>
        </div></>
    return <><div className="AvatarEditorHeader">
        <b>Course-Editor</b>
        <Flag flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile}/>
        <Flag className={"flag_sub"} flag={course.fromLanguageFlag} flag_file={course.fromLanguageFlagFile}/>
        <span className={"AvatarEditorHeaderFlagname"}>{`${course.learningLanguageName} (from ${course.fromLanguageName})`}</span>
        {course.official ? <span><i>official</i></span> :
            !props.showImport ?
            <div id="button_import" className="editor_button" onClick={() => props.do_setShowImport(1)}
            style={{marginLeft: "auto"}}>
            <div><img src="icons/import.svg"/></div>
            <span>Import</span>
            </div> :
            <div id="button_back" className="editor_button" onClick={() => props.do_setShowImport(0)}
            style={{marginLeft: "auto"}}>
            <div><img src="icons/back.svg"/></div>
            <span>Back</span>
            </div>
        }
    </div></>
}
