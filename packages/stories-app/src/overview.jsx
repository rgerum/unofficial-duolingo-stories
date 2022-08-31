import {useUsername, Login} from './login'
import {CourseList} from "./course-list";
import {CourseDropdown} from "./course-dropdown";
import {SetList} from "./story-list";
import {getCoursesUser, getPublicCourses, getStoriesSets} from "./api_calls";
import {Legal, useDataFetcher} from "story-component";

import {Link, useParams,} from "react-router-dom";
import React from "react";

/* ******** */


function Error() {
    return <div id="error">
        <div>
            <h2>404 Not Found</h2>
            <img alt={"sad duo"} width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" /><br/>
            <p>The page you requested was not found.<br/></p>
            <p>If you think this is an error on the website, please report it on <a href="https://discord.gg/4NGVScARR3">Discord</a>.</p>
        </div>
    </div>
}

export function IndexContent(props) {
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();
    let courses = useDataFetcher(getPublicCourses, []);
    
    const courses_user = useDataFetcher(getCoursesUser, [username]);
    let {lang,lang_base} = useParams();
    const course_data = useDataFetcher(getStoriesSets, [lang, lang_base, username]);

    
    let story_count = 0;
    let language_count = 0;

    // Split off minor conlangs - we don't want on front page
    let conlangs = [];

    if(courses) {
        for (let course of courses) {
            story_count += course.count;
            language_count += 1;
        }

        for (let course of courses) {
            if (props.filter) {
                if (props.filter === "conlang") {
                    if (course.conlang) {
                        conlangs.push(course)
                    }
                    courses = conlangs;
                } else {
                    for (let course in conlangs) {
                        courses = courses.filter(item => item !== course);
                    }
                }
            }
        }
    }

    let error = props.error;
    if(lang !== undefined && course_data?.sets?.length === 0)
        error = true;
    
    return <div>
        <div id="header_index">
            <Link to={"/"} className="duostories_title">Duostories</Link>
            <CourseDropdown course_data={course_data} courses={(courses_user !== undefined && courses_user.length) ? courses_user : courses} />
            <Login useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />
        </div>
        <div id="main_index">
            {error ? <Error/> :
            <>
                <h1 className={"main_title"}>Unofficial Duolingo Stories</h1>
                <p className={"title_desc"}>
                A community project to bring the original <a href="https://www.duolingo.com/stories">Duolingo Stories</a> to new languages.
                    {courses ? <><br/>{story_count} stories in {language_count} courses and counting!</> : <></>}
                </p>
                <p className={"title_desc"}>
                If you want to contribute or discuss the stories, meet us on <a href="https://discord.gg/4NGVScARR3">Discord</a><br/>
                or learn more about the project in our <Link to={"/faq"}>FAQ</Link>.
                </p>
                {Object.keys(conlangs).length ? 
                    <p><b>Notice:</b> You're currently on the page for conlangs without ISO-3 codes. We keep them here as to not clutter the front page, but we're always happy to have more!
                        <br/> To return to the main page, click <Link to="/" >here</Link>.
                    </p>
                    : <></>}

                {lang !== undefined ?
                    <SetList sets={course_data?.sets} about={course_data?.about} conlang_count={conlangs.length} /> :
                    <CourseList courses={courses} />
                }

                <hr/>
                <Legal/>
            </>}
        </div>

    </div>
}

