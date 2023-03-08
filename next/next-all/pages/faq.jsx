import React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "../components/layout/layout";


export default function Faq() {
    //document.title = `Duostories FAQ`;

    return <>
        <Head>
            <link rel="canonical" href={`https://www.duostories.org/faq`} />
            <title>Duostories FAQ</title>
            <meta name="description" content={`Information about the duostories project.`}/>
        </Head>
        <Layout>
            <h1>Frequently Asked Questions</h1>
            <h2>Is this website open source?</h2>
            <p>Yes it is! The code is hosted on Github <Link href="https://github.com/rgerum/unofficial-duolingo-stories">rgerum/unofficial-duolingo-stories</Link>
            </p>
            <p>
                If you like it you can give it a star. <Link href="https://github.com/rgerum/unofficial-duolingo-stories"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/rgerum/unofficial-duolingo-stories?style=social" /></Link>
            </p>

            <h2>When will these stories be on the official Duolingo website?</h2>
            <p>Probably never. This project is not linked to Duolingo in any way. Duolingo has in the past worked with volunteers
                but they stopped the volunteer program. Therefore, it is highly unlikely that Duolingo will adopt these stories.</p>

            <h2>Are you allowed to use the material of Duolingo?</h2>
            <p>Well we asked Duolingo for permission. We came to an agreement that we are allowed to use the
                story material for this purpose. If you want to use Duolingo material, please ask them. Our licence agreement
                only covers this website.</p>

            <h2>Can I contribute?</h2>
            <p>Yes! The project is run by volunteers that want to bring the Duolingo stories to new languages.
                You can join us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.</p>

            <h2>Will you add a course in language X?</h2>
            <p>If we have a volunteer, or better yet, a group of volunteers, then yes. Maybe you can spread the word, find some
                native speakers in your target language, and bring them to our <Link href="https://discord.gg/4NGVScARR3">Discord</Link> server.</p>

            <h2>Can I write my own stories as a contributor?</h2>
            <p>Our current goal is to create good translations of the existing Duolingo stories. Duolingo has put great
                effort into developing stories that help learners to learn a new language using stories. We do not have the
                resources to create similar high quality stories, nor do we see the need to go beyond the current stories.
                Maybe when we have finished translating all of them ;-).</p>

            <h2>I found a mistake!</h2>
            <p>Yes, despite our continuous efforts, there might be mistakes in the translations. You can reach us
                on <Link href="https://discord.gg/4NGVScARR3">Discord</Link> to report mistakes.</p>

            <h2>I found a bug on the page or want to suggest a new feature.</h2>
            <p>We have a <Link href={"https://github.com/rgerum/unofficial-duolingo-stories/issues"}>bugtracker</Link> on Github where you can report issues or feature requests. Or again discuss them with
                us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.</p>

            <h2>Who runs this website?</h2>
            <p>The website was developed by me, "randrian". You can find me on <Link href="https://www.duolingo.com/profile/Randriano">Duolingo</Link> or on <a href="https://github.com/rgerum">Github</a>.
                Some people did minor contributions to the website, see the Github repository. You are welcome to be part of them.</p>
            <p>I am in no way associated with Duolingo.</p>
            <p>But of course this website would be nothing without its active group of contributors! Meet them on <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.</p>
        </Layout>
    </>
}