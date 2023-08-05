'use client'
import React from "react";

import Story from "components/story/story";
import {useRouter} from "next/navigation";
import {EditorContext} from "components/story/story";
import styles from "components/story/story.module.css";

export default function StoryWrapper({story}) {
    const navigate = useRouter().push;

    return <>
        <div className={styles.main}>
            <EditorContext.Provider value={{lineno: 3}}>
                <Story story={story} editor={{lineno: 3}} navigate={navigate} />
            </EditorContext.Provider>
        </div>
    </>
}