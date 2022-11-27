import styles from "./loggedinbutton.module.css"
import React from "react";
import {useUser} from "../../lib/hooks";
import Dropdown from "../dropdown";


export function LoggedInButton({page}) {
    const { userdata, logout} = useUser();

    if(userdata === undefined)
        return <></>
    return <Dropdown>
        <div className={styles.round}>{userdata.username.substring(0, 1)}</div>
        <div>
            {page === "stories" ?
                <div id="button_editor" className={styles.profile_dropdown_button + "  button_dark_mode"} onClick={()=>{window.toggle_dark()}}>
                    Dark Mode
                </div> : null}
            {userdata.role !== 0 && page !== "stories" ?
                <div id="button_editor" className={styles.profile_dropdown_button} onClick={()=>{window.location.href = "https://www.duostories.org"}}>
                    Stories
                </div> : null}
            {userdata.role !== 0 && page !== "editor" ?
                <div id="button_editor" className={styles.profile_dropdown_button} onClick={()=>{window.location.href = "https://editor.duostories.org"}}>
                    Editor
                </div> : null}
            {userdata.admin !== 0 && page !== "admin" ?
                <div id="button_editor" className={styles.profile_dropdown_button} onClick={()=>{window.location.href = "https://admin.duostories.org"}}>
                    Admin
                </div> : null}
            <div className={styles.profile_dropdown_button} onClick={() => logout()} >Log out</div>
        </div>
    </Dropdown>
}