import React from "react";
import {get_avatar_names, get_language, get_speakers} from "pages/api/editor/avatar/[language]";

import LanguageEditor from "./language_editor";
import {getServerSession} from "next-auth/next";

import {authOptions} from "pages/api/auth/[...nextauth]";


export default async function Page({params}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session.user.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    let language = await get_language(params.language);

    if(!language) {
        return {
            notFound: true,
        }
    }

    let speakers = await get_speakers(params.language);
    let avatar_names = await get_avatar_names(params.language);

    // Render data...
    return <>
        <LanguageEditor language={language} speakers={speakers} avatar_names={avatar_names}/>
    </>
}
