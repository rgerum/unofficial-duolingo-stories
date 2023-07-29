import Link from 'next/link'
import {authOptions} from "pages/api/auth/[...nextauth]";
import styles from './layout.module.css'
import React from "react";
import LoggedInButton, {LogInButton} from "components/login/loggedinbutton";
import {getServerSession} from "next-auth/next";
import {redirect} from "next/navigation";


export default async function Layout({ children }) {
    const session = await getServerSession(authOptions);

    if(!session?.user?.admin)
        redirect('/auth/admin');

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
        <Link id="button_import" className={styles.editor_button} href={`/admin/story`}
              data-cy="button_import">
            <div><img alt="import button" src="/editor/icons/import.svg"/></div>
            <span>Story</span>
        </Link>
        <div style={{marginLeft: "auto"}}></div>
        {(session?.user) ?
            <LoggedInButton page={"admin"} course_id={undefined} session={session}/> :
            <LogInButton/>
        }
    </nav>
    <div className={styles.main_index}>
        {children}
    </div>
    </>
    )
}