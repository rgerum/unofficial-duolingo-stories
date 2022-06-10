import {useUsername, Login, LoginDialog} from './login'
import {CourseList} from "./course-list";
import {CourseDropdown} from "./course-dropdown";
import {SetList} from "./story-list";
import {useDataFetcher} from "./hooks";
import {getCoursesUser, getPublicCourses, getStoriesSets} from "./api_calls";
import {Legal} from "story-component";


/* ******** */


export function IndexContent(props) {
    let lang = props.course[0];
    let lang_base = props.course[1];
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();
    const courses = useDataFetcher(getPublicCourses, []);
    const courses_user = useDataFetcher(getCoursesUser, [username]);
    const course_data = useDataFetcher(getStoriesSets, [lang, lang_base, username]);

    function languageClicked(lang, lang_base) {
        props.setCourse([lang, lang_base])
    }

    if(showLogin !== 0)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    return <div>
        <div id="header_index">
            <a href={"?"} className="duostories_title">Duostories</a>
            <CourseDropdown course_data={course_data} courses={(courses_user !== undefined && courses_user.length) ? courses_user : courses} languageClicked={languageClicked} />
            <Login useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />
        </div>
        <div id="main_index">
            <h1 className={"main_title"}>Unofficial Duolingo Stories</h1>
            <p className={"title_desc"}>
                A community project to bring the original <a href="https://www.duolingo.com/stories">Duolingo Stories</a> to new languages.
            </p>
            <p className={"title_desc"}>
                If you want to contribute or discuss the stories, meet us on <a href="https://discord.gg/4NGVScARR3">Discord</a>.
            </p>
            {lang !== undefined ?
                <SetList sets={course_data?.sets} onStoryClicked={(id)=>props.onStartStory(id)}/> :
                <CourseList courses={courses} languageClicked={languageClicked}/>
            }

            <hr/>
            <Legal/>

        </div>
    </div>
}

