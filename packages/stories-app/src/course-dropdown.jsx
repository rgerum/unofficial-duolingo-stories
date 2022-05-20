import {Flag} from "./react/flag";


function LanguageButtonSmall(props) {
    /**
     * A button in the language drop down menu (flag + name)
     */
    let course = props.course;

    return <a
        className="language_select_item"
        onClick={props.onClick}
        href={`index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
        style={{display: "block"}}
    >
        <Flag flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />
        <span>{course.name || course.learningLanguageName}</span>
    </a>;
}

export function CourseDropdown(props) {
    const courses = props.courses;

    if(courses === undefined)
        return <div id="header_lang_selector" />
    return (
        <div id="header_lang_selector">
            {courses.map(course => (
                <LanguageButtonSmall key={course.id} course={course} onClick={(e) => {e.preventDefault(); props.languageClicked(course.learningLanguage, course.fromLanguage)}} />
            ))}
        </div>
    );
}