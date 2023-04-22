import Head from 'next/head'
import Link from "next/link";

import Layout,  from '../components/layout/layout'
import CourseList from "../components/layout/course_list";
import MainTitle from "../components/layout/main_title";
import TitleDesc from "../components/layout/title_desc";
import {getLinkedProviders} from "./api/profile";
import {signIn} from "next-auth/react";
import styles from "./profile.module.css"

function ProviderButton({d, value}) {
    console.log(d, value);
    return <div className={styles.account}>
        <img loading="lazy" id="provider-logo" src={`https://authjs.dev/img/providers/${d}.svg`} width="24" height="24"/>
        <div>{d}: {value ? <span className={styles.linkedd}>Linked</span> : <span className={styles.link} onClick={() => signIn(d)}>Link</span>}</div>
    </div>
    return <button className={styles.button} onClick={() => signIn(d)}>Link {d} {value}</button>
}

export default function Page({ providers, userdata}) {
    console.log(providers.role);
    return <><Head>
        <title>Duostories: Userprofile</title>
        <link rel="canonical" href="https://www.duostories.org/profile" />
        <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
        <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
    </Head>
    <Layout userdata={userdata}>
        <header>
            <MainTitle>Profile</MainTitle>
            <TitleDesc>
                Your user profile, its liked roles and linked login accounts.
            </TitleDesc>
        </header>
        <div className={styles.profile}>
            <div>Username: <input value={providers.name}/></div>
            <div>Email: <input value={providers.email}/></div>
            <div className={styles.roles}>
            {providers.role.length ? providers.role.map((d, i) => <span key={i}>{d}</span>) : <></>}
            </div>

            <h2>Linked Accounts</h2>
            <span>When you have liked your account to a login provider you can use these providers instead of login in with username and password or email.</span>
            <div className={styles.links}>
            {Object.entries(providers.provider_linked).map(([key, value]) => <ProviderButton key={key} d={key} value={value} />)}
            </div>
        </div>


    </Layout>
    </>
}

export async function getServerSideProps(context) {
    const providers = await getLinkedProviders(context.req)
    return {props: {providers}}
}
