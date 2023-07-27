import styles from "./profile.module.css"
import query from "lib/db";
import {getServerSession} from "next-auth/next";
import {authOptions} from "pages/api/auth/[...nextauth]";
import ProviderButton from "./button";
import {signIn} from "next-auth/react";
import Header from "../header";


export const metadata = {
    canonical: 'https://duostories.org/profile',
};

async function get_user_id_from_username(user_name) {
    let res = await query(`SELECT id FROM user WHERE username = ?`, [user_name]);
    if(res.length)
        return res[0].id;
    return 0;
}

async function getLinkedProviders() {
    let providers_base = ['facebook', 'github', 'google', 'discord'];
    //const token = await getToken({ req })
    const session = await getServerSession(authOptions);
    if(!session)
        await signIn();
    let user_id = await get_user_id_from_username(session.user.name);
    const req2 = await query(`SELECT provider FROM account WHERE user_id = ?`, [user_id]);

    let provider_linked = {};
    for(let p of providers_base) {
        provider_linked[p] = false;
    }
    let providers = [];
    for(let p of req2) {
        providers.push(p.provider)
        provider_linked[p.provider] = true;
    }
    let role = [];
    if(session.user.admin)
        role.push("Admin")
    if(session.user.role)
        role.push("Contributor")

    return {providers, name: session.user.name, email: session.user.email, role: role, provider_linked};
}


export default async function Page() {
    const providers = await getLinkedProviders();

    console.log(providers.role);
    return <>
        <Header>
            <h1>Profile</h1>
            <p>
                Your user profile, its liked roles and linked login accounts.
            </p>
        </Header>
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
    </>
}