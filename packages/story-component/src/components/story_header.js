import React from "react";
import "./story_header.css"
import {Link} from "react-router-dom";

export function StoryHeader(props) {
    return <div id="header">
        <div id="header_icon"><Link id="quit" to="/" /></div>
        <div id="progress">
            <div id="progress_inside" style={{width: props.progress/props.length*100+"%"}}>
                <div id="progress_highlight"></div>
            </div>
        </div>
    </div>
}