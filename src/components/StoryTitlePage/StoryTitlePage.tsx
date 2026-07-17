import React from "react";
import Button from "@/components/ui/button";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";
import type { StoryData } from "@/app/(stories)/story/[story_id]/getStory";
import { getStoryTranscript } from "@/app/(stories)/story/[story_id]/story_seo";
import { cn } from "@/lib/utils";

function StoryTitlePage({
  story,
  next,
}: {
  story: StoryData;
  next: () => void;
}) {
  const header = story.elements[0];
  const localisation = useLocalisation();
  const transcript = getStoryTranscript(story);

  if (header.type != "HEADER")
    throw new Error("story needs to start with header");

  return (
    <div className="pointer-events-none fixed inset-0 w-full overflow-y-auto">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-[72px]">
        <div className="w-full text-center">
          <img
            width="180"
            className="mx-auto block"
            src={header.illustrationUrl}
            alt={"title image"}
          />
        </div>
        <div className="mt-[18px] mb-9 w-full text-center text-[25px] font-bold text-[var(--text-color)]">
          {header.learningLanguageTitleContent.text}
        </div>
        <div className="pointer-events-auto w-full text-center">
          <Button variant="primary" onClick={next}>
            {localisation("button_start_story") || "Start the Story"}
          </Button>
        </div>
        {transcript.length > 0 ? (
          <details
            className={cn(
              "pointer-events-auto mt-8 w-full max-w-[500px] rounded-2xl border-2 border-[var(--color_base_border)] bg-[var(--color_base_background)] px-4 py-3 text-left text-[var(--text-color)]",
              story.learning_language_rtl && "[direction:rtl] text-right",
            )}
          >
            <summary className="cursor-pointer text-[18px] font-bold">
              Transcript
            </summary>
            <div className="mt-4 space-y-3 text-[18px] leading-[28px]">
              {transcript.map((line) => (
                <p key={line.id} className="m-0">
                  {line.text}
                </p>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

export default StoryTitlePage;
