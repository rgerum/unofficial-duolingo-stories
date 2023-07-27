import Head from 'next/head'
import Link from "next/link";

import Layout,  from '../components/layout/layout'
import MainTitle from "../components/layout/main_title";
import TitleDesc from "../components/layout/title_desc";
import {getLinkedProviders} from "./api/profile";
import {signIn} from "next-auth/react";
import {getSession} from "next-auth/react";
import styles from "./profile.module.css"
import styles2 from "./auth/register.module.css"

function ProviderButton({d, value}) {
    return <div className={styles.account}>
        <img alt="" loading="lazy" id="provider-logo" src={`https://authjs.dev/img/providers/${d}.svg`} width="24" height="24"/>
        <div>{d}: {value ? <span className={styles.linkedd}>Linked</span> : <span className={styles.link} onClick={() => signIn(d)}>Link</span>}</div>
    </div>
}

export default function Page({ providers, userdata}) {
    // if not logged in show a notice
    if(!providers) {
        return <>
            <Head>
                <title>Duostories Login</title>
                <link rel="canonical" href={`https://duostories.org/login`} />
            </Head>

            <div id={styles2.login_dialog}>
                <Link href="/" id={styles2.quit}></Link>
                <div>
                    <h2>Not Logged in</h2>
                    <p>
                        You need to be logged in to see your profile.
                    </p>
                    <button data-cy="submit"  className={styles2.button}
                            onClick={signIn}>{ "Log in" }</button>
                </div>
            </div>
        </>
    }

    return <><Head>
        <title>Duostories: Userprofile</title>
        <link rel="canonical" href="https://duostories.org/profile" />
        <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
        <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
    </Head>
    <Layout userdata={userdata}>
        <header>
            <MainTitle>Profile</MainTitle>
            <TitleDesc>
                Your user profile, liked roles and linked login accounts.
            </TitleDesc>
        </header>
        <div className={styles.profile}>
            <div>Username: <input value={providers.name}/></div>
            <div>Email: <input value={providers.email}/></div>
            <div className={styles.roles}>
            {providers.role.length ? providers.role.map((d, i) => <span key={i}>{d}</span>) : <></>}
            </div>

            <h2>Linked Accounts</h2>
            <span>When you have linked your account to a login provider you can use these providers instead of logging in with username and password.</span>
            <div className={styles.links}>
            {Object.entries(providers.provider_linked).map(([key, value]) => <ProviderButton key={key} d={key} value={value} />)}
            </div>
        </div>


    </Layout>
    </>
}

export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session) {
        return {props: {}}
    }
    const providers = await getLinkedProviders(context.req)
    return {props: {providers}}
}
