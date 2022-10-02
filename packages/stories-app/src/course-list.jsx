import './course-list.css';
import {Flag} from "story-component";
import {MyLink} from "./mylink";
import {useSuspendedDataFetcher} from "./api_calls/include";
import {getPublicCourses} from "./api_calls/course";


export default function CourseList({conlang_count, startTransition}) {
    let courses = useSuspendedDataFetcher(getPublicCourses, []);

    return (
        <div>
            <MyLink key={0} to="/tr-en" className="language_select_button celebration" startTransition={startTransition}>
                <Flag iso="tr" />
                <div className="language_select_button_text" style={{width: "68%"}}>Celebrating our Turkish team which just reached 100 translated stories!
                    Congratulations to <i>Danika_Dakika</i> and <i>deck</i>. <span className="celebration_date">— 19. Sep. 2022</span></div>
                <span className="celebration_icon">🎉</span>
            </MyLink>
            {Object.entries(courses).map(([name,]) => (
                name === "Conlangs" ?
                    <MyLink key={name} to="/conlangs" className="language_select_button conlang-link" startTransition={startTransition}>
                        <Flag iso={"conlangs"} flag_file={"flag_conlangs.svg"} />
                        <span className="language_select_button_text">Conlangs Index:</span>
                        <span className="language_story_count" id="conlangs-count">{conlang_count} stories</span>
                        <img className="arrow" src="/stories/icons/arrow.svg" alt=">" />
                    </MyLink>
                    :
                <div className="course_list" key={name}>
                    <hr/>
                    <div className="course_group_name">Stories for {name} Speakers</div>
                    {courses[name].map(course => (
                    <LanguageButton key={course.id} course={course} startTransition={startTransition} />
                    ))}
                </div>
            ))
            }
        </div>
    );
}

function LanguageButton(props) {
    let course = props.course;

    return <MyLink
        data-cy={"language_button_big_"+course.id}
        className="language_select_button"
        startTransition={props.startTransition}
        to={`/${course.learningLanguage}-${course.fromLanguage}`}
    >
        <Flag iso={course.learningLanguage} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />

        <span className="language_select_button_text">{course.name}</span>
        <span className="language_story_count">{course.count} stories</span>
    </MyLink>;
}
