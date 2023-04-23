import Head from 'next/head'

import Layout from '../../components/admin/layout'
import styles from "./index.module.css"
import {getSession} from "next-auth/react";

export default function Page({courses, userdata}) {

    // Render data...
    let course_id = undefined;
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org/admin" />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <div className={styles.root}>
                <div>Admin</div>
            </div>
        </Layout>
    </>
}



export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session.user.admin) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    return {
        props: {},
    };
}
