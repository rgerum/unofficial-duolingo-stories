import React, {useState} from 'react';
import {useDataFetcher, useDataFetcher2, useInput} from './hooks'
import {Spinner, SpinnerBlue} from './react/spinner'
import {Flag} from './react/flag'
import {
    getLanguageList, setLanguage, getCourseList, setCourse
} from "./api_calls.mjs";

function DropDown(props) {
    return <div className="dropdown">
        <button className="dropbtn">{props.value}</button>
        <div className="dropdown-content">
            {props.options.map(opt =>
                    <a href="#">{opt.value}</a>
                )}
        </div>
    </div>
}

function ChangeAbleValue(props) {
    const [value, setValue] = useInput(props.obj[props.name]);
    const [name, setName] = useInput(props.languages[props.obj[props.name]]?.name || "");

    function edited(e) {
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
        function edited(e) {
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
            console.log("language_idsss", language_id);
            return <td>
                <div className="dropdown">
                    <button className="dropbtn">
                        <div className="lang">
                            {valid ?
                        <Flag flag={props.languages[value].flag} flag_file={props.languages[value].flag_file} />
                                : <Flag flag={-2736} />
                            }
                        <input value={name} onChange={edited}/>
                        </div>
                    </button>
                    <div className="dropdown-content">
                        {language_id.map(lang =>
                            <a key={props.languages[lang].id} onClick={() => edited(props.languages[lang].name)}>
                                <div className="lang">
                                <Flag flag={props.languages[lang].flag} flag_file={props.languages[lang].flag_file} />
                                <div>{props.languages[lang].name}</div>
                            </div>
                            </a>
                        )}
                    </div>
                </div>
            </td>
        }
        return <td>
            {value != -1 ?
                <div className="lang">
                <Flag flag={props.languages[value].flag} flag_file={props.languages[value].flag_file} />
                    {props.languages[value].name}
                </div>
                :
                <div className="lang"><Flag flag={-2736} />
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
    let obj = props.obj;

    var data = {...props.obj};
    function onChange(key, value) {
        data[key] = value === "" ? undefined : value;
        console.log("changed", data);
    }
    async function save() {
        console.log(await setCourse(data));
        setEdit(false);
    }

    if(languages === undefined)
        return <tr></tr>

    return <tr onClick={() => setEdit(true)}>
        <td>
        </td>
        {props.attributes.map(attr =>
        <ChangeAbleValue obj={props.obj} languages={languages} name={attr} edit={edit} callback={onChange}/>
    )}<td>{edit ? <span onClick={save}>[save]</span> : ""}</td></tr>
}

export function CourseList(props) {
    const languages = useDataFetcher(getLanguageList);
    const users = useDataFetcher(getCourseList);

    if(languages === undefined || users === undefined)
        return <Spinner />

    let languages_id = {}
    for(let l of languages)
        languages_id[l.id] = l;
    console.log("languages_id", languages_id);

    return <>
        <table id="story_list" data-cy="story_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th></th>
                <th data-js-sort-colnum="0">learningLanguage</th>
                <th data-js-sort-colnum="1">fromLanguage</th>
                <th data-js-sort-colnum="1">public</th>
                <th data-js-sort-colnum="2">name</th>
                <th data-js-sort-colnum="4"></th>
            </tr>
            </thead>
            <tbody>
            <AttributeList languages={languages_id} obj={{"name":"", "public": 0, "fromLanguage": 1, "learningLanguage": -1}} attributes={["learningLanguage","fromLanguage","public", "name"]} />
            {users.map((user, i) =>
                <AttributeList key={user.id} languages={languages_id} obj={user} attributes={["learningLanguage","fromLanguage","public", "name"]} />
            )}
            </tbody>
        </table>
    </>
}
