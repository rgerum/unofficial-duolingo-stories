import "./loggedinbutton.css"
import React from "react";


export function LoggedInButton(props) {
    let userdata = props?.userdata
    let username = userdata || props.username;
    let doLogout = userdata?.logout || props.doLogout;
    let current_page = props.page;

    //username = {role: 1, username: "test"}
    if(username === undefined)
        return <></>
    return <div id="loggedin" title={username.username}>
            <span>{username.username.substring(0, 1)}</span>
            <div id="diamond-wrap">
                <div id="diamond"></div>
            </div>
            <div id="profile_dropdown">
                {current_page === "stories" ?
                <div id="button_editor" className="profile_dropdown_button button_dark_mode" onClick={()=>{window.toggle_dark()}}>
                    Dark Mode
                </div> : null}
                {username.role !== 0 && current_page !== "stories" ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://www.duostories.org"}}>
                        Stories
                    </div> : null}
                {username.role !== 0 && current_page !== "editor" ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://editor.duostories.org"}}>
                        Editor
                    </div> : null}
                {username.admin !== 0 && current_page !== "admin" ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://admin.duostories.org"}}>
                        Admin
                    </div> : null}
                <div className="profile_dropdown_button" onClick={() => doLogout()} >Log out</div>
            </div>
        </div>
}