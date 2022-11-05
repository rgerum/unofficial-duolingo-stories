import React, {useState} from 'react';
import {useDataFetcher, useInput} from 'includes'
import {Spinner} from 'ui_elements'
import {
    getUserList,
    setUserActivated, setUserWrite
} from "./api_calls.mjs";
import "./user-editor.css"


function Activate(props) {
    let [checked, setChecked] = useState(props.user.activated)
    async function OnClick(e) {
        e.preventDefault();
        let value = await setUserActivated({id: props.user.id, activated: checked ? 0 : 1});
        if(value !== undefined)
            setChecked(checked ? 0 : 1);
    }
    return <label className="switch" onClick={OnClick}>
        <input type="checkbox" checked={checked} readOnly />
            <span className="slider round"></span>
    </label>
}

function Write(props) {
    let [checked, setChecked] = useState(props.user.role)
    async function OnClick(e) {
        e.preventDefault();
        let value = await setUserWrite({id: props.user.id, write: checked ? 0 : 1});
        if(value !== undefined)
            setChecked(checked ? 0 : 1);
    }
    return <label className="switch" onClick={OnClick}>
        <input type="checkbox" checked={checked} readOnly />
        <span className="slider round"></span>
    </label>
}

export function UserList() {
    const users = useDataFetcher(getUserList);

    const [search, setSearch] = useInput("");

    if(users === undefined)
        return <Spinner />

    let filtered_user = [];
    if(search === "")
        filtered_user = users;
    else {
        for(let user of users) {
            if((""+user.username).toLowerCase().indexOf(search.toLowerCase()) !== -1) {
                filtered_user.push(user);
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
                <th data-js-sort-colnum="0">Username</th>
                <th data-js-sort-colnum="1">Email</th>
                <th data-js-sort-colnum="1">Date</th>
                <th data-js-sort-colnum="2">Stories</th>
                <th data-js-sort-colnum="4">Activated</th>
                <th data-js-sort-colnum="5" className="js-sort-active">Write</th>
            </tr>
            </thead>
            <tbody>
            {filtered_user.map(user =>
                <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.regdate}</td>
                    <td>{user.count}</td>
                    <td><Activate user={user}/></td>
                    <td><Write user={user}/></td>
                </tr>
            )}
            </tbody>
        </table>
    </>
}
