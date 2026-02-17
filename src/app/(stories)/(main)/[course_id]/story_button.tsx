"use client";

import Link from "next/link";
import Image from "next/image";

interface StoryData {
  id: number;
  name: string;
  active: string;
  gilded: string;
  active_lip: string;
}

export default function StoryButton({
  story,
  done,
}: {
  story?: StoryData;
  done?: boolean;
}) {
  if (!story) {
    return (
      <div className="my-[7px] mr-[17px] mb-[10px] ml-[17px] inline-block w-[134px] rounded-[5px] outline-offset-[5px] max-[335px]:m-0 max-[268px]:mx-auto">
        <div className="mt-[15px] ml-[10px] inline-block h-[113px] w-[113px] animate-pulse rounded-[17px] bg-slate-200" />
        <div className="mt-4 mb-[7px] h-[21px] w-[134px] animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <Link
      data-cy={"story_button_" + story.id}
      className="group my-[7px] mr-[17px] mb-[10px] ml-[17px] inline-block w-[134px] cursor-pointer rounded-[5px] text-center no-underline outline-offset-[5px] max-[335px]:m-0 max-[268px]:mx-auto"
      href={`/story/${story.id}`}
      onClick={() => {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "story_autoplay_ts",
            String(Date.now()),
          );
        }
      }}
    >
      <div
        className="relative mt-[15px] ml-[10px] inline-block h-[113px] w-[113px] overflow-visible rounded-[17px] bg-[var(--story-button-gold)]"
        data-done={done}
        style={done ? {} : { background: "#" + story.active_lip }}
      >
        <Image
          src={done ? story.gilded : story.active}
          alt=""
          width={135}
          height={124}
          className="absolute top-[-11px] left-[-11px] h-[124px] w-[135px] max-w-none -translate-y-[5px] transition-transform duration-300 ease-out group-hover:-translate-y-[7px] group-active:translate-y-0 motion-reduce:transition-none"
        />
      </div>
      <div className="mt-4 mb-[7px] w-full text-center text-[calc(17/16*1rem)] leading-[21px] font-bold text-[var(--text-color-dim)]">
        {story.name}
      </div>
    </Link>
  );
}
