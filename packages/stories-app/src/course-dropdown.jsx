import "./course-dropdown.css";

import {Flag} from "story-component";
import {Link} from "react-router-dom";


function LanguageButtonSmall(props) {
    /**
     * A button in the language drop down menu (flag + name)
     */
    let course = props.course;

    return <Link
        className="language_select_item"
        onClick={props.onClick}
        to={`/${course.learningLanguage}-${course.fromLanguage}`}
    >
        <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />
        <span>{course.name || course.learningLanguageName}</span>
    </Link>;
}

export function CourseDropdown(props) {
    const course_data = props.course_data;
    const courses = props.courses;


    if(courses === undefined)
        return (
            <div id="header_language">
                <div id="diamond-wrap">
                    <div id="diamond"></div>
                </div>
                <Flag iso={course_data?.learningLanguage} flag={course_data?.learningLanguageFlag} width={40} flag_file={course_data?.learningLanguageFlagFile} />
                <div id="header_lang_selector" />
            </div>
        );
    return (
    <div id="header_language">
        <div id="diamond-wrap">
            <div id="diamond"></div>
        </div>
        <Flag iso={course_data?.learningLanguage} flag={course_data?.learningLanguageFlag} width={40} flag_file={course_data?.learningLanguageFlagFile} />
        <div id="header_lang_selector">
        {courses.map(course => (
            <LanguageButtonSmall key={course.id} course={course} />
        ))}
        </div>
    </div>);

}