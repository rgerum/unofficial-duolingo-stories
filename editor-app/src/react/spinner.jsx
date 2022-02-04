import React from 'react';
import "./spinner.css"

export function Spinner(props) {
    return (
        <div id="spinner" style={{position: "relative", width: "100%", height: "200px"}}>
            <div className="spinner_parent">
                <div className="spinner_point point1" />
                <div className="spinner_point point2" />
                <div className="spinner_point point3" />
            </div>
        </div>
    );
}