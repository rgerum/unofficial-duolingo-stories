import './course-list.css';
import {Flag} from "ui_elements";
import {MyLink} from "ui_elements";
import {useSuspendedDataFetcher} from "./api_calls/include";
import {getPublicCourses} from "./api_calls/course";
import {useNavigate} from "react-router-dom";
import {Helmet} from "react-helmet-async";
import React from "react";


export default function CourseList({conlang_count, startTransition}) {
    let courses = useSuspendedDataFetcher(getPublicCourses, []);
    let navigate = useNavigate();

    document.title = `Duostories: improve your Duolingo learning with community translated Duolingo stories.`;

    /*
        <div key={0} className="language_select_button celebration" >
            <span className="celebration_icon">🎉</span>
            <div className="language_select_button_text" style={{width: "68%"}}>We reached 1000 translated stories this week!<br/>
                Congratulations to all contributors. <span className="celebration_date">— 10. Nov. 2022</span></div>
            <span className="celebration_icon">🎉</span>
        </div>

        <MyLink key={0} to="/nl-en" navigate={navigate} className="language_select_button celebration" startTransition={startTransition}>
            <Flag iso="nl" />
            <div className="language_select_button_text" style={{width: "68%"}}>Celebrating our Dutch team which just reached 100 translated stories!
                Congratulations to <i>Plutone</i> and <i>zaop</i>. <span className="celebration_date">— 19. Nov. 2022</span></div>
            <span className="celebration_icon">🎉</span>
        </MyLink>
     */
    return (
        <div>
            <Helmet>
                <link rel="canonical" href="https://www.duostories.org" />
                <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
                <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
            </Helmet>
   
            {Object.entries(courses).map(([name,]) => (
                name === "Conlangs" ?
                    <MyLink key={name} to="/conlangs" navigate={navigate} className="language_select_button conlang-link" startTransition={startTransition}>
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
    let navigate = useNavigate();

    return <MyLink
        data-cy={"language_button_big_"+course.id}
        className="language_select_button"
        startTransition={props.startTransition}
        to={`/${course.learningLanguage}-${course.fromLanguage}`}
        navigate={navigate}
    >
        <Flag iso={course.learningLanguage} flag={course.learningLanguageFlag} flag_file={course.learningLanguageFlagFile} />

        <span className="language_select_button_text">{course.name}</span>
        <span className="language_story_count">{course.count} stories</span>
    </MyLink>;
}
