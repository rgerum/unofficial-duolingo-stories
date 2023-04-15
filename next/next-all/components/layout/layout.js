import Link from 'next/link'

import styles from './layout.module.css'

import Login from "./../login/login_dialog";
import CourseDropdown from "./course-dropdown";
import Legal from "./legal";
import { useSession, signIn, signOut } from "next-auth/react"

export default function Layout({ children, course }) {
    /*
                <CourseDropdown userdata={userdata} />
            <Login userdata={userdata} />
     */
    //const { userdata, error } = useSWR('https://test.duostories.org/stories/backend_node_test/session', fetch)

    //if (error) return <div>failed to load</div>
    //if (!userdata) return <div>loading...</div>

  return (
      <>
        <nav className={styles.header_index}>
            <Link href={"/"} className={styles.duostories_title}>Duostories</Link>
            <div style={{marginLeft: "auto"}}></div>
            <CourseDropdown course={course}/>
            <Login />
        </nav>
        <div className={styles.main_index}>
          {children}
        </div>
        <Legal />
    </>
  )
}
