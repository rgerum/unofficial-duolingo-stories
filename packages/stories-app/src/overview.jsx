import {useUsername, Login, LoginDialog} from './login'
import {CourseList} from "./course-list";
import {CourseDropdown} from "./course-dropdown";
import {Flag} from "./react/flag";
import {SetList} from "./story-list";
import {useDataFetcher} from "./hooks";
import {getPublicCourses} from "./api_calls";


/* ******** */


export function IndexContent(props) {
    let lang = props.course[0];
    let lang_base = props.course[1];
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();
    const courses = useDataFetcher(getPublicCourses, []);

    function languageClicked(lang, lang_base) {
        props.setCourse([lang, lang_base])
    }

    if(showLogin !== 0)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    return <div>
        <div id="header_index">
            <div id="header_language">
                <Flag language_data={props.language_data} lang={lang} flag_file={lang.flag_file} file={lang.flag}/>
                <CourseDropdown courses={courses} languageClicked={languageClicked} />
            </div>
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
                <SetList lang={lang} lang_base={lang_base} username={username} onStoryClicked={(id)=>props.onStartStory(id)}/> :
                <CourseList courses={courses} languageClicked={languageClicked}/>
            }

            <hr/>

            <div style={{textAlign: "center", color:"gray", fontSize: "0.8em"}}>
                These stories are owned by Duolingo, Inc. and are used under license from Duolingo.<br/>
                Duolingo is not responsible for the translation of these stories <span
                id="license_language">{props.language_data && props.language_data[lang] ? "into "+props.language_data[lang].name : ""}</span> and this is not an official product of Duolingo.<br/>
                Any further use of these stories requires a license from Duolingo.<br/>
                Visit <a style={{color:"gray"}} href="https://www.duolingo.com">www.duolingo.com</a> for more
                information.
            </div>

        </div>
    </div>
}

