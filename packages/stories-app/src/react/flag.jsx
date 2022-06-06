import React from 'react';
import "./flag.css"

export function Flag(props) {
    /**
     * A big flag button
     * @type {{flag_file: string, flag: number}}
     */
    return <div className={"flag "+props.className + (props.flag_file ? " custom-flag":"")}
                style={props.flag_file ? {backgroundImage: `url(https://duostories.org/stories/flags/${props.flag_file})`} : {backgroundPosition: `0 ${props.flag}px`}}
                
    />
}
