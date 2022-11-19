import React from 'react';
import {useDataFetcher, useInput} from 'includes'
import {Spinner, Flag} from 'ui_elements'
import {
    getLanguageList, getCourseList, setCourse
} from "./api_calls.mjs";


function ChangeAbleValue(props) {
    const [value, setValue] = useInput(props.obj[props.name]);
    const [name, setName] = useInput(props.languages[props.obj[props.name]]?.name || "");

    let edited = function(e) {
        props.callback(props.name, e.target.value);
        setValue(e)
    }

    if(props.name.endsWith("Language")) {
        let valid = false;
        for(let lang of Object.getOwnPropertyNames(props.languages)) {
            if(props.languages[lang].name.toLowerCase() === name.toLowerCase()) {
                valid = true;
                break;
            }
        }
        edited = function(e) {
            let value = e.target?.value ? e.target.value : e
            for(let lang of Object.getOwnPropertyNames(props.languages)) {
                if(props.languages[lang].name.toLowerCase() === value.toLowerCase()) {
                    setValue(lang)
                    props.callback(props.name, lang);
                    break;
                }
            }
            setName(e)
        }

        if(props.edit) {
            let language_id = []
            for(let lang of Object.getOwnPropertyNames(props.languages)) {
                if(props.languages[lang].name.toLowerCase().indexOf(name.toLowerCase()) !== -1)
                    language_id.push(lang);
            }
            return <td>
                <div className="dropdown">
                    <button className="dropbtn">
                        <div className="lang">
                            {valid ?
                        <Flag iso={props.languages[value].short} width={40} flag={props.languages[value].flag} flag_file={props.languages[value].flag_file} />
                                : <Flag width={40} flag={-2736} />
                            }
                        <input value={name} onChange={edited}/>
                        </div>
                    </button>
                    <div className="dropdown-content">
                        {language_id.map(lang =>
                            <button key={props.languages[lang].id} onClick={() => edited(props.languages[lang].name)}>
                                <div className="lang">
                                <Flag iso={props.languages[lang].short} width={40} flag={props.languages[lang].flag} flag_file={props.languages[lang].flag_file} />
                                <div>{props.languages[lang].name}</div>
                            </div>
                            </button>
                        )}
                    </div>
                </div>
            </td>
        }
        return <td>
            {value !== -1 ?
                <div className="lang">
                <Flag iso={props.languages[value].short} width={40} flag={props.languages[value].flag} flag_file={props.languages[value].flag_file} />
                    {props.languages[value].name}
                </div>
                :
                <div className="lang"><Flag width={40} flag={-2736} />
                    {"New"}
                </div>
            }
        </td>
    }

    if(props.edit)
        return <td><input value={value} onChange={edited}/></td>
    return <td>{value}</td>
}

function AttributeList(props) {
    const [edit, setEdit] = useInput(false);

    let languages = props.languages;

    const data = {...props.obj};

    function onChange(key, value) {
        data[key] = value === "" ? undefined : value;
    }
    async function save() {
        await setCourse(data);
        setEdit(false);
    }

    if(languages === undefined)
        return <tr></tr>

    return <tr onClick={() => setEdit(true)}>
        <td></td>
        {props.attributes.map((attr, i) =>
        <ChangeAbleValue key={i} obj={props.obj} languages={languages} name={attr} edit={edit} callback={onChange}/>
    )}<td>{edit ? <span onClick={save}>[save]</span> : ""}</td></tr>
}

export function CourseList() {
    const languages = useDataFetcher(getLanguageList);
    const users = useDataFetcher(getCourseList);

    const [search, setSearch] = useInput("");

    if(languages === undefined || users === undefined)
        return <Spinner />

    let languages_id = {}
    for(let l of languages)
        languages_id[l.id] = l;

    let filtered_courses = [];
    if(search === "")
        filtered_courses = users;
    else {
        for(let course of users) {
            if(!languages_id[course.learningLanguage])
                continue
            if(languages_id[course.learningLanguage].name.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
                languages_id[course.fromLanguage].name.toLowerCase().indexOf(search.toLowerCase()) !== -1) {
                filtered_courses.push(course);
            }
        }
    }

    return <>
        <div>Search
            <input value={search} onChange={setSearch}/>
        </div>
        <table id="story_list" data-cy="story_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th></th>
                <th data-js-sort-colnum="0">learningLanguage</th>
                <th data-js-sort-colnum="1">fromLanguage</th>
                <th data-js-sort-colnum="1">public</th>
                <th data-js-sort-colnum="2">name</th>
                <th data-js-sort-colnum="2">conlang</th>
                <th data-js-sort-colnum="3">about</th>
                <th data-js-sort-colnum="4"></th>
            </tr>
            </thead>
            <tbody>
            <AttributeList languages={languages_id} obj={{"name":"", "public": 0, "fromLanguage": 1, "learningLanguage": -1, "about": "", "conlang": 0}} attributes={["learningLanguage","fromLanguage","public", "name", "conlang", "about"]} />
            {filtered_courses.map(course =>
                <AttributeList key={course.id} languages={languages_id} obj={course} attributes={["learningLanguage","fromLanguage","public", "name", "conlang", "about"]} />
            )}
            </tbody>
        </table>
    </>
}
