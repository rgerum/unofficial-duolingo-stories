import React from "react";
import "./finish_page.css"


export function FinishedPage(props) {
    /* The page at the end of the story. */
    return <div className="page_finished">
        <div>
            <div className="finished_image_container">
                {/* add the three blinking stars */}
                <div>
                    <div className="star1" />
                    <div className="star2" />
                    <div className="star3" />
                </div>
                {/* the icon of the story which changes from color to golden */}
                <div className="finished_image">
                    <img src={props.story.illustrations.active} alt=""/>
                    <img src={props.story.illustrations.gilded} className="image_golden" alt=""/>
                </div>
            </div>
            {/* the text showing that the story is done */}
            <h2>Story complete!</h2><p>You finished "{props.story.fromLanguageName}"</p>
        </div>
    </div>
}