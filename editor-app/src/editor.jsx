import React from 'react';
import {useDataFetcher, useDataFetcher2, useEventListener} from './hooks'
import {Spinner} from './react/spinner'
import {Flag} from './react/flag'
import {useUsername, Login, LoginDialog} from './login'
import {setPublic, getCourses, getCourse, getImportList, setImport, getSession} from "./api_calls.mjs";
import "./editor.css"


function CourseList(props) {
    const courses = useDataFetcher(getCourses);
    if(courses === undefined)
        return null;
    return <div id="languages">
        {courses.map((course, index) =>
            <div key={index}>
                <a className="course_selection_button"
                   href={`editor_overview.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
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
        <h1 id="title">{`${course.learningLanguageName} - (from ${course.fromLanguageName}) Import`}</h1>
        <div>Importing from Spainsh (from English).</div>
        <table id="story_list" style={{display: "inline-block"}} className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Set</th>
                <th colSpan="2" data-js-sort-colnum="1">Name</th>
                <th style={{textAlign: "center"}} data-js-sort-colnum="7">Copies</th>
                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="8"></th>
            </tr>
            </thead>
            <tbody>
            {courseImport.map(story =>
                <tr key={story.id}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="44px"><img src={story.copies ? story.gilded : story.active} width="44px" /></td>
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
    let setShowImport = props.setShowImport;
    document.getElementById('button_import').onclick = ()=>setShowImport(course.id)
    return <>
        <h1 id="title">{`${course.learningLanguageName} - (from ${course.fromLanguageName})`}</h1>
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
                    <td width="44px"><img
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
    let course_id = props.course_id;
    const [course, courseRefetch] = useDataFetcher2(getCourse, [course_id]);
    const [showImport, do_setShowImport] = React.useState(false);
    function setShowImport(state) {
        if(state) {
            document.getElementById('button_import').style.display = "none"
            document.getElementById('button_back').style.display = "flex"
            document.getElementById('button_back').onclick = ()=>setShowImport(false)
        }
        else {
            document.getElementById('button_import').style.display = "flex"
            document.getElementById('button_back').style.display = "none"
        }
        do_setShowImport(state);
    }
    if(showImport && showImport !== course_id)
        setShowImport(false);
    return <>{
        course === undefined ?
        <>
            <h1>Loading</h1>
            <Spinner/>
        </>
        : showImport ?
            <ImportList course={course} setShowImport={setShowImport}/>
        : <EditList course={course} setShowImport={setShowImport}/>
    }</>
}

function Overview(props) {
    let course_id = props.course;
    let [username, doLogin, doLogout] = useUsername();

    async function togglePublic(story) {
        if(confirm(`Do you want to ${story.public ? "hide" : "publish"} the story \"${story.name_base}\"?`)) {
            let response = setPublic(story.id, !story.public);
            if(response.status === 200) {
                await storiesRefetch();
            }
        }
    }
    let lang = course_id;
    let lang_base = course_id;
//     <a href={`story.html?test&story=${story.id}&lang=el&lang_base=en`}>[test]</a>
    /*
    *         <div id="header_index">
            <Login useUsername={[username, doLogin, doLogout]} />
        </div>
    * */
    return <>
        <CourseList setCourse={props.setCourse}/>
        <div id="main_overview">
            <div id="main_overview_container">
            { course_id ?
                <StoriesList course_id={course_id}/>
                :
                <><h1 id="title">Editor - Stories</h1>
                <p id="no_stories">Click on one of the courses to display its stories.</p>
                </>
            }
            </div>
        </div>
    </>
}


export function EditorOverview(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [course, setCourse] = React.useState(urlParams.get("course") || undefined);
    const [username, usernameRefetch] = useDataFetcher2(getSession, []);


    function doSetCourse(course) {
        if(course === undefined)
            ;//history.pushState({course: course}, "Language"+course, `index.html`);
        else
            ;//history.pushState({course: course}, "Language"+course, `index.html?lang=${course[0]}&lang_base=${course[1]}`);
        setCourse(course);
    }

    useEventListener("popstate", (event) => {
        if(event.state.story)
            changeStory(event.state.story)
        else {
            setStory(null);
            if(event.state.course)
                doSetCourse(event.state.course)
            else
                doSetCourse([undefined, undefined])
        }
    })
    console.log("username", username)
    if(0) {
        if (username === undefined) return <Spinner/>
        if (username.username === undefined) return <div style={{margin: "auto"}}>
            <img style={{margin: "auto"}} width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg"/><br/>
            You need to be logged in to use the editor.
        </div>
        if(username.role !== 1) return <div style={{margin: "auto"}}>
            <img width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" /><br/>
            <img src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" />
            You need to have permissions to access the editor.
        </div>
    }
    return <Overview course={course} setCourse={doSetCourse}/>
}

