import React from "react";
import "./story_header.css"
import {MyLink} from "ui_elements";

export function StoryHeader({course, progress, length, navigate}) {
    return <div id="header">
        <div id="header_icon"><MyLink id="quit" to={"/"+course} navigate={navigate} /></div>
        <div id="progress">
            <div id="progress_inside" style={{width: progress/length*100+"%"}}>
                <div id="progress_highlight"></div>
            </div>
        </div>
    </div>
}