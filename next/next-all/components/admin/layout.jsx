import Link from 'next/link'

import styles from './layout.module.css'
import Login from "../login/login_dialog";
import React from "react";

export default function Layout({ children }) {

    return (
    <>
    <nav className={styles.header_index}>
        <b>Admin Interface</b>
        <Link id="button_import" className={styles.editor_button} href={`/admin/users`}
              data-cy="button_import">
            <div><img alt="import button" src="/editor/icons/import.svg"/></div>
            <span>Users</span>
        </Link>
        <Link id="button_import" className={styles.editor_button} href={`/admin/languages`}
              data-cy="button_import">
            <div><img alt="import button" src="/editor/icons/import.svg"/></div>
            <span>Languages</span>
        </Link>
        <Link id="button_import" className={styles.editor_button} href={`/admin/courses`}
              data-cy="button_import">
            <div><img alt="import button" src="/editor/icons/import.svg"/></div>
            <span>Courses</span>
        </Link>
        <div style={{marginLeft: "auto"}}></div>
        <Login page={"admin"}/>
    </nav>
    <div className={styles.main_index}>
        {children}
    </div>
    </>
    )
}