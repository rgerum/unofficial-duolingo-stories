import React, {useState} from 'react';
import {useDataFetcher, useDataFetcher2, useEventListener, useInput} from './hooks'
import {Spinner, SpinnerBlue} from './react/spinner'
import {Flag} from './react/flag'
import {
    getCourses,
    getCourse,
    getImportList,
    setImport,
    setStatus,
    setApproval,
    getUserList,
    setUserActivated, setUserWrite
} from "./api_calls.mjs";
import "./user-editor.css"


function CourseList(props) {
    const courses = props.courses;
    if(courses === undefined)
        return <div id="languages"><Spinner/></div>;
    return <div id="languages">
        {courses.map((course, index) =>
            <div key={index}>
                <a className={"course_selection_button" + (props.course_id === course.id ? " course_selection_button_active" : "")}
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

function Activate(props) {
    let [checked, setChecked] = useState(props.user.activated)
    async function OnClick(e) {
        e.preventDefault();
        let value = await setUserActivated({id: props.user.id, activated: checked ? 0 : 1});
        if(value !== undefined)
            setChecked(checked ? 0 : 1);
    }
    return <label className="switch" onClick={OnClick}>
        <input type="checkbox" checked={checked} readOnly />
            <span className="slider round"></span>
    </label>
}

function Write(props) {
    let [checked, setChecked] = useState(props.user.role)
    async function OnClick(e) {
        e.preventDefault();
        let value = await setUserWrite({id: props.user.id, write: checked ? 0 : 1});
        if(value !== undefined)
            setChecked(checked ? 0 : 1);
    }
    return <label className="switch" onClick={OnClick}>
        <input type="checkbox" checked={checked} readOnly />
        <span className="slider round"></span>
    </label>
}

export function UserList(props) {
    const users = useDataFetcher(getUserList);

    const [search, setSearch] = useInput("");

    if(users === undefined)
        return <Spinner />

    let filtered_user = [];
    if(search === "")
        filtered_user = users;
    else {
        for(let user of users) {
            console.log("filter", user.username)
            console.log("filter2", user)
            if((""+user.username).toLowerCase().indexOf(search.toLowerCase()) !== -1) {
                filtered_user.push(user);
            }
        }
    }

    return <>
        <div>Search
            <input value={search} onChange={setSearch}/>
        </div>
        <table id="story_list" data-cy="story_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th data-js-sort-colnum="0">Username</th>
                <th data-js-sort-colnum="1">Email</th>
                <th data-js-sort-colnum="1">Date</th>
                <th data-js-sort-colnum="2">Stories</th>
                <th data-js-sort-colnum="4">Activated</th>
                <th data-js-sort-colnum="5" className="js-sort-active">Write</th>
            </tr>
            </thead>
            <tbody>
            {filtered_user.map((user, i) =>
                <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.regdate}</td>
                    <td>{user.count}</td>
                    <td><Activate user={user}/></td>
                    <td><Write user={user}/></td>
                </tr>
            )}
            </tbody>
        </table>
    </>
}

export function UserOverview() {
    return <>
        <div id="toolbar">
        </div>
        <div id="root">
            <UserList/>
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
        <Flag flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile}/>
        <Flag className={"flag_sub"} flag={course.fromLanguageFlag} flag_file={course.fromLanguageFlagFile}/>
        <span className={"AvatarEditorHeaderFlagname"} data-cy="course-title">{`${course.learningLanguageName} (from ${course.fromLanguageName})`}</span>
        {course.official ? <span data-cy="label_official"><i>official</i></span> :
            !props.showImport ?
            <div id="button_import" className="editor_button" onClick={() => props.do_setShowImport(1)}
            style={{marginLeft: "auto"}} data-cy="button_import">
            <div><img alt="import button" src="icons/import.svg"/></div>
            <span>Import</span>
            </div> :
            <div id="button_back" className="editor_button" onClick={() => props.do_setShowImport(0)}
            style={{marginLeft: "auto"}} data-cy="button_back">
            <div><img alt="back button" src="icons/back.svg"/></div>
            <span>Back</span>
            </div>
        }
    </div></>
}
