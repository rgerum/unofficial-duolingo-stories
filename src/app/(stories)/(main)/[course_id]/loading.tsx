import React from "react";
import Header from "../header";
import StoryButton from "./story_button";
import setListStyles from "./set_list.module.css";
import skeletonStyles from "./story_button.module.css";

export default function Loading() {
  return (
    <>
      <Header>
        <h1>
          <span className={skeletonStyles.animated_background}>
            Unofficial Language Duolingo Stories
          </span>
        </h1>
        <p>
          <span className={skeletonStyles.animated_background}>
            Learn Language with 000 community translated Duolingo Stories.
          </span>
        </p>
      </Header>
      <div className={setListStyles.story_list}>
        {[...Array(2)].map((_, i) => (
          <ol key={i} className={setListStyles.set_content} aria-label={`Set ${i + 1}`}>
            <div className={setListStyles.set_title} tabIndex={-1} aria-hidden={true}>
              Set {i + 1}
            </div>
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
