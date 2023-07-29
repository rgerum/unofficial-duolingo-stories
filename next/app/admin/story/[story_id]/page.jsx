import {story_properties} from "pages/api/admin/set_story";
import {notFound} from "next/navigation";
import StoryDisplay from "./story_display";


export default async function Page({params}) {
    let story = await story_properties(params.story_id);

    if(story === undefined)
        notFound();

    return <StoryDisplay story={story} />
}
