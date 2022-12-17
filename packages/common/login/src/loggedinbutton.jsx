import "./loggedinbutton.css"
import React from "react";


export function LoggedInButton({userdata, page}) {
    function getDarkModeButtonText() { return window.get_isDarkMode() ? "Light Mode" : "Dark Mode"; }

    function updateDarkModeButtonText() {
        let darkModeButton = document.getElementsByClassName("button_dark_mode")[0];
        if (darkModeButton) darkModeButton.innerHTML = getDarkModeButtonText();
    }

    //username = {role: 1, username: "test"}
    if(userdata === undefined)
        return <></>
    return <div id="loggedin" title={userdata.username}>
            <span>{userdata.username.substring(0, 1)}</span>
            <div id="diamond-wrap">
                <div id="diamond"></div>
            </div>
            <div id="profile_dropdown">
                {page === "stories" ?
                <div id="button_editor" className="profile_dropdown_button button_dark_mode" onClick={()=>{window.toggle_dark(); updateDarkModeButtonText()}}>
                    {getDarkModeButtonText()}
                </div> : null}
                {userdata.role !== 0 && page !== "stories" ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://www.duostories.org"}}>
                        Stories
                    </div> : null}
                {userdata.role !== 0 && page !== "editor" ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://editor.duostories.org"}}>
                        Editor
                    </div> : null}
                {userdata.admin !== 0 && page !== "admin" ?
                    <div id="button_editor" className="profile_dropdown_button" onClick={()=>{window.location.href = "https://admin.duostories.org"}}>
                        Admin
                    </div> : null}
                <div className="profile_dropdown_button" onClick={() => userdata.logout()} >Log out</div>
            </div>
        </div>
}