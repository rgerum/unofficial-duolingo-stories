import Head from 'next/head'
import Layout from '../../../components/admin/layout'
import {getSession} from "next-auth/react";
import {fetch_post} from "../../../lib/fetch_post";
import Switch from "../../../components/layout/switch";
import {useState} from "react";
import {story_properties} from "../../api/admin/set_story";
import Link from "next/link";


export default function Page({story, userdata}) {
    const [story_, setStory] = useState(story);

    // Render data...
    async function changePublished() {
        let res = await fetch_post(`/api/admin/set_story`, {id: story_.id, public: 1-story_.public});
        let data = await res.json();
        setStory(data);
    }
    async function deleteApproval(approval_id) {
        let res = await fetch_post(`/api/admin/set_story`, {id: story_.id, approval_id: approval_id});
        let data = await res.json();
        setStory(data);
    }
    console.log(story_)
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org/editor" />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <img src={"https://stories-cdn.duolingo.com/image/"+story_.image+".svg"} width={"200px"}/>
            <h1>{story_.name}</h1>
                <p>Published <Switch checked={story_.public} onClick={changePublished}/></p>
                <Link href={`/editor/course/${story_.short}`}>Course {story_.short}</Link>
                <h2>Approvals</h2>
                <ul>
                    {story_.approvals.map((d) => (
                        <li key={d.id}>{d.date} {d.username} <span style={{cursor: "pointer"}}
                                                                   onClick={() => deleteApproval(d.id)}>✗</span>
                        </li>
                    ))}
                </ul>
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

    let story = await story_properties(context.params.story);

    if(story === undefined)
        return {
            notFound: true,
        }

    return {
        props: {story},
    };
}
