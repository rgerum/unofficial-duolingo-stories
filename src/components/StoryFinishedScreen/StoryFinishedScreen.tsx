import React from "react";
import useScrollIntoView from "@/hooks/use-scroll-into-view.hook";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

function StoryFinishedScreen({
  story,
  disableScroll,
}: {
  story: StoryData;
  disableScroll?: boolean;
}) {
  const localisation = useLocalisation();
  const ref = useScrollIntoView(!disableScroll);

  return (
    <div
      ref={ref}
      id="finishedPage"
      className="mb-[100px] flex min-h-[calc(100vh-100px)] w-full items-center justify-center border-t-2 border-t-[var(--overview-hr)] px-4 pt-8 pb-6 max-[500px]:pt-6"
      data-hidden={false}
      data-cy="finished"
    >
      <div className="w-full max-w-[420px] text-center">
        <div className="relative inline-block h-[200px] w-[200px] max-[500px]:h-[170px] max-[500px]:w-[170px]">
          {/* add the three blinking stars */}
          <div>
            <div
              className="absolute top-5 left-[-30px] h-[20.4px] w-[20.4px] rounded-[3.3px] bg-[var(--finished-star-gold)] opacity-50 [transform:rotate(-45deg)_scale(1)]"
              style={{ animation: "story-finished-star 2s 0.1s" }}
            />
            <div
              className="absolute right-[-15px] bottom-[-20px] h-[19.2px] w-[19.2px] rounded-[3.3px] bg-[var(--finished-star-gold)] opacity-50 [transform:rotate(-45deg)_scale(1)]"
              style={{ animation: "story-finished-star 2s 0.3s" }}
            />
            <div
              className="absolute top-[-10px] left-0 h-[12.2px] w-[12.2px] rounded-[3.3px] bg-[var(--finished-star-gold)] opacity-50 [transform:rotate(-45deg)_scale(1)]"
              style={{ animation: "story-finished-star 2s 0.2s" }}
            />
          </div>
          {/* the icon of the story which changes from color to golden */}
          <div className="relative inline-block h-full w-full overflow-visible p-0">
            <img
              src={story.illustrations.active}
              className="absolute top-0 left-0 h-full w-full"
              alt=""
            />
            <img
              src={story.illustrations.gilded}
              className="absolute top-0 left-0 h-full w-full opacity-100"
              style={{ animation: "story-finished-fade-in 2s" }}
              alt=""
            />
          </div>
        </div>
        {/* the text showing that the story is done */}
        <h2>{localisation("story_finished")}</h2>
        <p>
          {localisation("story_finished_subtitle", {
            $story_title: story.from_language_name,
          }) || `You finished ${story.from_language_name}`}
        </p>
      </div>
    </div>
  );
}

export default StoryFinishedScreen;
