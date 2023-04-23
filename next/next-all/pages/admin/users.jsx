import Head from 'next/head'

import Layout from '../../components/admin/layout'
import styles from "./index.module.css"
import {getSession} from "next-auth/react";
import {useInput} from "../../lib/hooks";
import {Spinner} from "../../components/layout/spinner";
import {fetch_post} from "../../lib/fetch_post";
import {user_list} from "../api/admin/set_user_activate";
import {useState} from "react";


export async function setUserActivated(data) {
    console.log("data", data)
    let res = await fetch_post(`/api/admin/set_user_activate`, data);
    res = await res.text()
    return res;
}

export async function setUserWrite(data) {
    console.log("data", data)
    let res = await fetch_post(`/api/admin/set_user_write`, data);
    res = await res.text()
    return res;
}



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

export function UserList({users}) {
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
        <table id="story_list" data-cy="story_list" className={"js-sort-table js-sort-5 js-sort-desc "+styles.admin_table} data-js-sort-table="true">
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


export default function Page({users, userdata}) {

    // Render data...
    let course_id = undefined;
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org/editor" />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <UserList users={users} />
        </Layout>
    </>
}



export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session.user.admin) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    let users = await user_list();
    console.log(users)

    return {
        props: {users},
    };
}
