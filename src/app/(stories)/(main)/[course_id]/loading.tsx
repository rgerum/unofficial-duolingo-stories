import React from "react";
import Header from "../header";
import StoryButton from "./story_button";

function SetTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-[1/-1] w-full overflow-x-hidden text-center text-[calc(27/16*1rem)] font-bold before:relative before:right-4 before:-ml-1/2 before:inline-block before:h-[2px] before:w-1/2 before:align-middle before:bg-[var(--overview-hr)] before:content-[''] after:relative after:left-4 after:-mr-1/2 after:inline-block after:h-[2px] after:w-1/2 after:align-middle after:bg-[var(--overview-hr)] after:content-[''] max-[480px]:text-[calc(22/16*1rem)]">
      {children}
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
      <div>
        {[...Array(2)].map((_, i) => (
          <ol
            key={i}
            className="m-0 mx-auto grid max-w-[720px] list-none grid-cols-[repeat(auto-fill,clamp(140px,50%,180px))] justify-center justify-items-center p-0"
          >
            <SetTitle>Set {i + 1}</SetTitle>
            {[...Array(4)].map((_, j) => (
              <li key={j}>
                <StoryButton />
              </li>
            ))}
          </ol>
        ))}
      </div>
    </>
  );
}
