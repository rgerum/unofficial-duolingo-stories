import "./loggedinbutton.css"
import React from "react";


export function LoggedInButton(props) {
    let username = props.username;
    let doLogout = props.doLogout;

    //username = {role: 1, username: "test"}
    if(username !== undefined)
        return <div id="loggedin" title={username.username}>
            <span>{username.username.substring(0, 1)}</span>
            <div id="diamond-wrap">
                <div id="diamond"></div>
            </div>
            <div id="profile_dropdown">
                {username.role !== 0 ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://www.duostories.org"}}>
                        Stories
                    </div> : null}
                {username.role !== 0 ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://editor.duostories.org"}}>
                        Editor
                    </div> : null}
                {username.admin !== 0 ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://admin.duostories.org"}}>
                        Admin
                    </div> : null}
                <div className="profile_dropdown_button" onClick={() => doLogout()} >Log out</div>
            </div>
        </div>
}