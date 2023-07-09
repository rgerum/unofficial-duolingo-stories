import Head from "next/head";
import Layout from "../components/layout/layout";
import MainTitle from "../components/layout/main_title";
import TitleDesc from "../components/layout/title_desc";


export default function Page({ counts, courses, userdata}) {
    // Render data...
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <header>
                <MainTitle>Unofficial Duolingo Stories</MainTitle>
                <TitleDesc>
                    404 This page could not found.
                </TitleDesc>
            </header>
        </Layout>
    </>
}