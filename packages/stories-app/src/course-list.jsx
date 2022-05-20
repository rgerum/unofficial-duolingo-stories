import {Flag} from "./react/flag";
import {Spinner} from "./react/spinner";


export function CourseList(props) {
    const courses = props.courses;

    if(courses === undefined)
        return <Spinner />
    return (
        <div className="set_list">
            {courses.map(course => (
                <LanguageButton key={course.id} course={course} onClick={(e) => {e.preventDefault(); props.languageClicked(course.learningLanguage, course.fromLanguage)}} />
            ))}
        </div>
    );
}

function LanguageButton(props) {
    let course = props.course;
    return <a
        data-cy={"language_button_big_"+course.id}
        className="language_select_button"
        onClick={props.onClick}
        href={`index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
    >
        <Flag flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} className="flag_big" />

        <span className="language_select_button_text">{course.name || course.learningLanguageName}</span>
    </a>;
}