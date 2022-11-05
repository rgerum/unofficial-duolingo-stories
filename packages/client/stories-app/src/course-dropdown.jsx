import "./course-dropdown.css";

import {useParams} from "react-router-dom";
import {MyLink} from "./mylink";
import {Flag} from "ui_elements";
import {useDataFetcher} from "includes";
import {useSuspendedDataFetcher} from "./api_calls/include";
import {getCoursesUser, getStoriesSets} from "./api_calls/course";



function LanguageButtonSmall({course, startTransition}) {
    /**
     * A button in the language drop down menu (flag + name)
     */

    return <MyLink
        className="language_select_item"
        startTransition={startTransition}
        to={`/${course.learningLanguage}-${course.fromLanguage}`}
    >
        <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />
        <span>{course.name || course.learningLanguageName}</span>
    </MyLink>;
}

export default function CourseDropdown({userdata, startTransition}) {
    let {lang, lang_base} = useParams();
    const course_data = useDataFetcher(getCoursesUser, [userdata.username]);
    const course = useSuspendedDataFetcher(getStoriesSets, [lang, lang_base, userdata.username]);

    if(userdata?.username === undefined || course_data === undefined || course_data?.length === 0)
        return <div id="header_language_placeholder"></div>

    return (
    <div id="header_language">
        <div id="diamond-wrap">
            <div id="diamond"></div>
        </div>
        <Flag iso={course.learningLanguage} width={40} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile}/>
        <nav id="header_lang_selector">
        {course_data.map(course => (
            <LanguageButtonSmall key={course.id} course={course} startTransition={startTransition} />
        ))}
        </nav>
    </div>);

}