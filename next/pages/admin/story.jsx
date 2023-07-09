import Head from 'next/head'
import Layout from '../../components/admin/layout'
import {getSession} from "next-auth/react";
import {useInput} from "../../lib/hooks";
import {useRouter} from "next/router";


export default function Page({userdata}) {
    let [id, setId] = useInput();
    let router = useRouter()
    async function go() {
        await router.push(`/admin/story/${id}`);
    }
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org/editor" />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <div>Story ID <input value={id} onChange={setId}/> <button onClick={go}>Go</button></div>

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
