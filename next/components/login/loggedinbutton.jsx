'use client';

import styles from "./loggedinbutton.module.css"
import styles2 from "./login.module.css"
import React, {useEffect, useState} from "react";
import Dropdown from "../layout/dropdown";
import {signIn, signOut} from "next-auth/react";
import Link from "next/link";


function useDarkLight() {
    const [activeTheme, setActiveTheme] = useState((typeof document !== 'undefined') ? document.body.dataset.theme : undefined);
    const inactiveTheme = activeTheme === "light" ? "dark" : "light";
    //...

    useEffect(() => {
        document.body.dataset.theme = activeTheme;
        window.localStorage.setItem("theme", activeTheme);
    }, [activeTheme]);

    return {set: setActiveTheme, toggle: () => setActiveTheme(inactiveTheme), value: activeTheme}
}

export function LogInButton() {
    return <button onClick={() => signIn()} className={styles2.button}
                   data-cy="login-button" style={{float: "none"}}>Log in</button>
}

export default function LoggedInButton({page, course_id, session}) {
    //const { data: session } = useSession();
    const controls = useDarkLight();

    let editor_link = "/editor"
    if(course_id)
        editor_link = "/editor/course/"+course_id
    let stories_link = "/"
    if(course_id)
        stories_link = "/"+course_id

    if(session === undefined)
        return <button onClick={() => signIn()} className={styles2.button}
                       data-cy="login-button" style={{float: "none"}}>Log in</button>
    return <Dropdown>
        <div className={styles.round} style={session.user?.image ? { backgroundImage: `url('${session.user?.image}')` } : {}}>{session.user.name.substring(0, 1)}</div>
        <div>
            <Link className={styles.profile_dropdown_button} href={"/profile"}>
                Profile
            </Link>
            {<div className={styles.profile_dropdown_button + "  button_dark_mode"} onClick={() => {
                controls.toggle()
            }}>
                {controls.value === "light" ? "Dark Mode" : "Light Mode"}
            </div>}
            {session.user?.role && page !== "stories" ?
                <Link className={styles.profile_dropdown_button} href={stories_link}>
                    Stories
                </Link> : null}
            {session.user?.role && page !== "editor" ?
                <Link className={styles.profile_dropdown_button} href={editor_link}>
                    Editor
                </Link> : null}
            {session.user?.admin && page !== "admin" ?
                <Link className={styles.profile_dropdown_button} href={"/admin"}>
                    Admin
                </Link> : null}
            <div className={styles.profile_dropdown_button} onClick={() => signOut()} >Log out</div>
        </div>
    </Dropdown>
}