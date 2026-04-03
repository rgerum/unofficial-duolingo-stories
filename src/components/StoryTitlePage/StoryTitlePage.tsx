import React from "react";
import Button from "../Button";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";
import { StoryType } from "@/components/editor/story/syntax_parser_new";

function StoryTitlePage({
  story,
  next,
}: {
  story: StoryType;
  next: () => void;
}) {
  const header = story.elements[0];
  const localisation = useLocalisation();

  if (header.type != "HEADER")
    throw new Error("story needs to start with header");

  return (
    <div className="pointer-events-none fixed inset-0 flex w-full flex-col items-center justify-center">
      <div className="w-full text-center">
        <img
          width="180"
          className="mx-auto block"
          src={header.illustrationUrl}
          alt={"title image"}
        />
      </div>
      <div className="mt-[18px] mb-9 w-full text-center text-[25px] font-bold text-[#4b4b4b]">
        {header.learningLanguageTitleContent.text}
      </div>
      <div className="pointer-events-auto w-full text-center">
        <Button primary onClick={next}>
          {localisation("button_start_story") || "Start the Story"}
        </Button>
      </div>
    </div>
  );
}

export default StoryTitlePage;
