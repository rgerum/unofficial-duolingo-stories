import React from 'react';
import "./flag.css"

export function Flag(props) {
    /**
     * A big flag button
     * @type {{flag_file: string, flag: number}}
     */
    let factor = 1.0;
    if(props.className === "flag_sub")
        factor = 0.9;
    return <div className={"flag "+props.className}
                style={props.flag_file ? {backgroundImage: `url(https://duostories.org/stories/flags/${props.flag_file})`} : {backgroundPosition: `0 ${props.flag*factor}px`}}
    />
}