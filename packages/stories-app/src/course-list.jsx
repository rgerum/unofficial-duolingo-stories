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
    
    // Add link to conlangs page in second position:
    
    languages.push(
        <a href="/conlangs" class="language_select_button conlang-link">
            <svg style="width: 88px; height: 70.8293px; min-width: 88px;" viewBox="0 0 82 66" class="conlang-flag">
                <image width="82" height="66" href="https://raw.githubusercontent.com/IFrzzl/auxlang-flags/f5ed64972f3fe8e2d8bc71adfe89daf101159740/conlangs.svg"></image>
                <rect class="flag_border_rect" x="4" y="1060" rx="12" ry="12" width="74" height="58"></rect>
            </svg>
            <span class="language_select_button_text">Conlangs Index:</span>
            <span class="language_story_count">4 stories</span>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="-19.45 -19.4 63.8 88.6" width="50" height="100" class="arrow" style="margin-right: max(10%, 40px);/*! margin-left: 0; */position: absolute;right: 0;">  <defs>    <inkscape:path-effect effect="fillet_chamfer" id="path-effect3241" is_visible="true" lpeversion="1" nodesatellites_param="F,0,0,1,0,4,0,1 @ F,0,0,1,0,4,0,1 @ F,0,0,1,0,4,0,1 @ F,0,0,1,0,4,0,1" unit="px" method="auto" mode="F" radius="4" chamfer_steps="1" flexible="false" use_knot_distance="true" apply_no_radius="true" apply_with_radius="true" only_selected="false" hide_knots="false"></inkscape:path-effect>  </defs>    <path style="fill:#000000;fill-opacity:0;stroke:#cbcbcb;stroke-width:9.70035;stroke-dasharray:none;stroke-opacity:1;paint-order:markers stroke fill" d="M 5.257673,4.8980883 18.782977,22.618243 a 4.944613,4.944613 91.618023 0 1 -0.175619,6.21719 L 4.8102721,44.93872 a 0.00205111,0.00205111 40.618918 0 0 0.00311,0.0027 L 18.915744,28.515929 a 4.8666132,4.8666132 91.230595 0 0 0.13273,-6.178874 L 5.303676,4.8624429 a 0.02909919,0.02909919 142.2297 0 0 -0.046003,0.035645 z"></path></svg>
        </a>);
        
    // if we have english courses add "English" as the first entry
    if(base_languages["English"])
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
