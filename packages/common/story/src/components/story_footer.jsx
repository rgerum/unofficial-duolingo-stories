import React from "react";
import "./story_footer.css"

export function Footer(props) {
    return <div id="footer"
         data-right={props.right ? "true" : undefined}
    >
        <div id="footer_content">
            <div id="footer_result">
                <div>
                    <div id="footer_result_icon"><span/></div>
                    <div id="footer_result_text"><h2>You are correct</h2></div>
                </div>
            </div>
            <div id="footer_buttons">
                {props.finished ?
                    <button id="button_next"
                            className="button" onClick={() => props.finish()}>finished</button>
                    : <button id="button_next"
                              data-status={props.blocked ? "inactive" : undefined}
                              className="button" onClick={() => props.next()}>continue</button>
                }
            </div>
        </div>
    </div>
}