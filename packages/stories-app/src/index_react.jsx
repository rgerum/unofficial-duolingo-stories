import {useDataFetcher} from './hooks'
import {useUsername, Login, LoginDialog} from './login'
import {getPublicCourses, getStoriesSets} from './api_calls'


export function Spinner() {
    return (
        <div id="spinner" style={{position: "relative", width: "100%", height: "200px"}}>
            <div className="spinner_parent">
                <div className="spinner_point point1" />
                <div className="spinner_point point2" />
                <div className="spinner_point point3" />
            </div>
        </div>
    );
}


function LanguageButtonSmall(props) {
    /**
     * A button in the language drop down menu (flag + name)
     */
    let course = props.course;

    let language = props.language_data[course.learningLanguage];
    return <a
        className="language_select_item"
        onClick={props.onClick}
        href={`index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
        style={{display: "block"}}
    >
        <Flag language_data={props.language_data}  lang={course.learningLanguage}/>
        <span>{course.name || language.name}</span>
    </a>;
}
function LanguageSelector(props) {
    const courses = useDataFetcher(getPublicCourses, []);

    if(courses === undefined || props.language_data === undefined)
        return <div id="header_lang_selector" />
    return (
        <div id="header_lang_selector">
            {courses.map(course => (
                <LanguageButtonSmall language_data={props.language_data} key={course.id} course={course} onClick={(e) => {e.preventDefault(); props.languageClicked(course.learningLanguage, course.fromLanguage)}} />
            ))}
        </div>
    );
}

/*
* LanguageSelectorBig
* */

function LanguageSelectorBig(props) {
    const courses = useDataFetcher(getPublicCourses, []);

    if(courses === undefined || props.language_data === undefined)
        return <Spinner />
    return (
        <div id="list">
            <div className="set_list">
                {courses.map(course => (
                    <LanguageButton key={course.id} language_data={props.language_data} course={course} onClick={(e) => {e.preventDefault(); props.languageClicked(course.learningLanguage, course.fromLanguage)}} />
                ))}
            </div>
        </div>
    );
}

function LanguageButton(props) {
    let course = props.course;
    let language = props.language_data[course.learningLanguage];
    return <a
        className="language_select_button"
        onClick={props.onClick}
        href={`index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
    >
        <Flag language_data={props.language_data} className="flag_big" lang={course.learningLanguage}/>

        <span className="language_select_button_text">{course.name || language.name}</span>
    </a>;
}

let flag_folder = "https://carex.uber.space/stories/"
if(window.location.host === "www.duostories.org" || window.location.host === "duostories.org")
    flag_folder = "https://"+window.location.host+"/stories/"

export function Flag(props) {
    /**
     * A big flag button
     * @type {{flag_file: string, flag: number}}
     */
    let language = {flag: 0, flag_file: ""};
    if(props.language_data && props.lang)
        language = props.language_data[props.lang];
    return <div className={"flag "+props.className}
                style={language.flag_file ? {backgroundImage: `url(${flag_folder}/flags/${language.flag_file})`} : {backgroundPosition: `0 ${language.flag}px`}}
    />
}

/* ******** */

function SetList(props) {
    const sets = useDataFetcher(getStoriesSets, [props.lang, props.lang_base, props.username]);

    if(sets === undefined)
        return <Spinner />;

    return <div id="list">
        {sets.map(stories => (
            <div key={stories[0].set_id} className="set_list">
                <div className="set">Set {stories[0].set_id}</div>
                {stories.map(story => (
                    <StoryButton key={story.id} story={story} onStoryClicked={props.onStoryClicked}  />
                ))}
            </div>
        ))}
    </div>
}

function StoryButton(props) {
    let story = props.story;
    return <div
        className="button_story_parent"
        onClick={(e) => {e.preventDefault(); props.onStoryClicked(story.id); }}
        href={`?story=${story.id}`}
    >
        <div
            className="button_story_img"
            data-done={story.time != null}
            style={story.time === null ? {background: "#"+story.activeLip} : {}}
        >
            <img src={story.time != null ? story.gilded : story.active} alt="story"/>
        </div>
        <div
            className="button_story_text"
        >{story.name}</div>
    </div>;
}


export function IndexContent(props) {
    let lang = props.course[0];
    let lang_base = props.course[1];
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    function languageClicked(lang, lang_base) {
        props.setCourse([lang, lang_base])
    }

    if(showLogin !== 0)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    return <div>
        <div id="header_index">
            <div id="header_language" style={{display: "block", float:"left"}}>
                <Flag language_data={props.language_data} lang={lang}/>
                <LanguageSelector language_data={props.language_data} languageClicked={languageClicked} />
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
            <br/>
            {lang !== undefined ?
                <SetList lang={lang} lang_base={lang_base} username={username} onStoryClicked={(id)=>props.onStartStory(id)}/> :
                <LanguageSelectorBig language_data={props.language_data} languageClicked={languageClicked}/>
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

