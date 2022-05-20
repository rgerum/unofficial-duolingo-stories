import {Flag} from "./react/flag";
import {Spinner} from "./react/spinner";


export function CourseList(props) {
    const courses = props.courses;

    if(courses === undefined)
        return <Spinner />

    let base_languages = {}
    for(let course of courses) {
        if(base_languages[course.fromLanguageName] === undefined)
            base_languages[course.fromLanguageName] = [];
        base_languages[course.fromLanguageName].push(course)
    }

    return (
        <div>
            {Object.entries(base_languages).map(([name, courses_list]) => (
                <div className="set_list" key={name}><hr/><div className="course_group_name">Stories for {name} Speakers</div>
                    {courses_list.map(course => (
                    <LanguageButton key={course.id} course={course} onClick={(e) => {
                        e.preventDefault();
                        props.languageClicked(course.learningLanguage, course.fromLanguage)
                    }}/>
                    ))}
                </div>
            ))
            }
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