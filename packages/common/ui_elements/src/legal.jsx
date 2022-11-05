import React from 'react';
import "./legal.css";

export function Legal(props) {
    return <small className="legal">
        These stories are owned by Duolingo, Inc. and are used under license from Duolingo.<br/>
        Duolingo is not responsible for the translation of these stories <span
        id="license_language">{props.language_name ? "into "+props.language_name : ""}</span> and this is not an official product of Duolingo.<br/>
        Any further use of these stories requires a license from Duolingo.<br/>
        Visit <a style={{color:"gray"}} href="https://www.duolingo.com">www.duolingo.com</a> for more
        information.
    </small>
}