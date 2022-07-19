import React, {useState} from 'react';
import {useDataFetcher, useDataFetcher2, useInput} from './hooks'
import {Spinner, SpinnerBlue} from './react/spinner'
import {Flag} from './react/flag'
import {
    getCourses,
    getCourse,
    getImportList,
    setImport,
    setStatus,
    setApproval,
    getUserList,
    setUserActivated, setUserWrite, getLanguageList, setLanguage
} from "./api_calls.mjs";
import "./user-editor.css"

function ChangeAbleValue(props) {
    const [value, setValue] = useInput(props.obj[props.name]);

    function edited(e) {
        props.callback(props.name, e.target.value);
        setValue(e)
    }

    if(props.edit)
        return <td><input value={value} onChange={edited}/></td>
    return <td>{value}</td>
}

function AttributeList(props) {
    const [edit, setEdit] = useInput(false);

    var data = {...props.obj};
    function onChange(key, value) {
        data[key] = value === "" ? undefined : value;
        console.log("changed", data);
    }
    async function save() {
        console.log(await setLanguage(data));
        setEdit(false);
    }

    return <tr onClick={() => setEdit(true)}>
        <td><Flag flag={props.obj.flag} flag_file={props.obj.flag_file} /></td>
        {props.attributes.map(attr =>
        <ChangeAbleValue obj={props.obj} name={attr} edit={edit} callback={onChange}/>
    )}<td>{edit ? <span onClick={save}>[save]</span> : ""}</td></tr>
}

export function LanguageList(props) {
    const users = useDataFetcher(getLanguageList);

    if(users === undefined)
        return <Spinner />
/*
https://admin.duostories.org/get2/language_list
 */
    return <>
        <table id="story_list" data-cy="story_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th></th>
                <th data-js-sort-colnum="0">Name</th>
                <th data-js-sort-colnum="1">ISO</th>
                <th data-js-sort-colnum="1">Duo Flag</th>
                <th data-js-sort-colnum="2">Flag File</th>
                <th data-js-sort-colnum="4">Default Voice</th>
                <th data-js-sort-colnum="4">RTL</th>
                <th data-js-sort-colnum="4"></th>
            </tr>
            </thead>
            <tbody>
            <AttributeList obj={{"name":"new language"}} attributes={["name","short","flag", "flag_file", "speaker", "rtl"]} />
            {users.map((user, i) =>
                <AttributeList obj={user} attributes={["name","short","flag", "flag_file", "speaker", "rtl"]} />
            )}
            </tbody>
        </table>
    </>
}
