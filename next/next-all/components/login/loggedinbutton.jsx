import styles from "./loggedinbutton.module.css"
import React from "react";
import {useUser} from "../../lib/hooks";
import Dropdown from "../layout/dropdown";
import {signOut, useSession} from "next-auth/react";


export function LoggedInButton({page}) {
    const { data: session } = useSession();
    //const { userdata, logout} = useUser();

    if(session === undefined)
        return <></>
    return <Dropdown>
        <div className={styles.round} style={{ backgroundImage: `url('${session.user?.image}')` }}>{session.user.name.substring(0, 1)}</div>
        <div>
            {page === "stories" ?
                <div id="button_editor" className={styles.profile_dropdown_button + "  button_dark_mode"} onClick={()=>{window.toggle_dark()}}>
                    Dark Mode
                </div> : null}
            {session.user.role !== 0 && page !== "stories" ?
                <div id="button_editor" className={styles.profile_dropdown_button} onClick={()=>{window.location.href = "https://www.duostories.org"}}>
                    Stories
                </div> : null}
            {session.user.role !== 0 && page !== "editor" ?
                <div id="button_editor" className={styles.profile_dropdown_button} onClick={()=>{window.location.href = "https://editor.duostories.org"}}>
                    Editor
                </div> : null}
            {session.user.admin !== 0 && page !== "admin" ?
                <div id="button_editor" className={styles.profile_dropdown_button} onClick={()=>{window.location.href = "https://admin.duostories.org"}}>
                    Admin
                </div> : null}
            <div className={styles.profile_dropdown_button} onClick={() => signOut()} >Log out</div>
        </div>
    </Dropdown>
}