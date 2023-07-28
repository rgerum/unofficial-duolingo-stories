import React from "react";

import StoryHeader from "components/story/layout/story_header";
import {Spinner} from "components/layout/spinner";

export default function Loading() {
    return <><StoryHeader progress={0} length={10} />
        <div style={{textAlign: "center", marginTop: "200px"}}>
            <p>Loading Story...</p>
            <Spinner/>
        </div>
        </>
}