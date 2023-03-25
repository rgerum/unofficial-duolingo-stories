import React from 'react';
import styles from "./spinner.module.css"

export function Spinner() {
    return (
        <div className={styles.spinner}>
            <div className={styles.spinner_parent}>
                <div className="spinner_point spinner_p1" />
                <div className="spinner_point spinner_p2" />
                <div className="spinner_point spinner_p3" />
            </div>
        </div>
    );
}

export function SpinnerBlue() {
    return (
        <div className={styles.spinner + " " + styles.spinner_blue}>
            <div className={styles.spinner_parent + " " + styles.spinner_blue_parent}>
                <div className={styles.spinner_point + " " + styles.spinner_p1 + " " + styles.spinner_blue_point} />
                <div className={styles.spinner_point + " " + styles.spinner_p2 + " " + styles.spinner_blue_point} />
                <div className={styles.spinner_point + " " + styles.spinner_p3 + " " + styles.spinner_blue_point} />
            </div>
        </div>
    );
}