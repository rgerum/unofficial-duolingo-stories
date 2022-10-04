import React from 'react';
import "./spinner.css"

export function Spinner() {
    return (
        <div className="spinner">
            <div className="spinner_parent">
                <div className="spinner_point spinner_p1" />
                <div className="spinner_point spinner_p2" />
                <div className="spinner_point spinner_p3" />
            </div>
        </div>
    );
}

export function SpinnerBlue() {
    return (
        <div className="spinner spinner_blue">
            <div className="spinner_parent spinner_blue_parent">
                <div className="spinner_point spinner_p1 spinner_blue_point" />
                <div className="spinner_point spinner_p2 spinner_blue_point" />
                <div className="spinner_point spinner_p3 spinner_blue_point" />
            </div>
        </div>
    );
}