import './course-list.css';
import {Flag, Spinner} from "story-component";
import {Link} from "react-router-dom";


export function CourseList(props) {
    const courses = props.courses;

    // show spinner if not yet loaded
    if(courses === undefined)
        return <Spinner />

    // sort courses by base language
    let base_languages = {};
    let languages = [];
    // iterate over all courses
    for(let course of courses) {
        // if base language not yet in list
        if(base_languages[course.fromLanguageName] === undefined) {
            // initialize the list
            base_languages[course.fromLanguageName] = [];
            // and add it to the list of all base languages (we will add English after sorting in the front)
            if(course.fromLanguageName !== "English")
                languages.push(course.fromLanguageName);
        }
        base_languages[course.fromLanguageName].push(course)
    }
    // sort the base languages and then add English as first (and most relevant)
    languages = languages.sort();
    languages.unshift("English");

    return (
        <div>
            {languages.map(name => (
                <div className="course_list" key={name}>
                    <hr/>
                    <div className="course_group_name">Stories for {name} Speakers</div>
                    {base_languages[name].map(course => (
                    <LanguageButton key={course.id} course={course} />
                    ))}
                </div>
            ))
            }
        </div>
    );
}

function LanguageButton(props) {
    let course = props.course;
    return <Link
        data-cy={"language_button_big_"+course.id}
        className="language_select_button"
        to={`/${course.learningLanguage}-${course.fromLanguage}`}
    >
        <Flag iso={course.learningLanguage} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />

        <span className="language_select_button_text">{course.name}</span>
        <span className="language_story_count">{course.count} stories</span>
    </Link>;
}