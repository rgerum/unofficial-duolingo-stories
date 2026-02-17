import React from "react";
import Header from "../header";
import StoryButton from "./story_button";

function SetTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex w-full items-center justify-center gap-4 px-[8vw] text-center text-[calc(27/16*1rem)] font-bold max-[1200px]:px-10 max-[480px]:px-0 max-[480px]:text-[calc(22/16*1rem)]">
      <span className="h-[2px] flex-1 bg-[var(--overview-hr)] max-[480px]:hidden" />
      <span>{children}</span>
      <span className="h-[2px] flex-1 bg-[var(--overview-hr)] max-[480px]:hidden" />
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <Header>
        <h1>
          <span className="inline-block animate-pulse rounded bg-slate-200 px-3 text-transparent">
            Unofficial Language Duolingo Stories
          </span>
        </h1>
        <p>
          <span className="inline-block animate-pulse rounded bg-slate-200 px-3 text-transparent">
            Learn Language with 000 community translated Duolingo Stories.
          </span>
        </p>
      </Header>
      <div className="mt-6 flex flex-col gap-[18px]">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="w-full">
            <SetTitle>Set {i + 1}</SetTitle>
            <ol className="mx-auto mb-[14px] grid max-w-[720px] list-none grid-cols-[repeat(auto-fill,clamp(140px,50%,180px))] justify-center justify-items-center gap-0 p-0">
              {[...Array(4)].map((_, j) => (
                <li key={j}>
                  <StoryButton />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </>
  );
}
