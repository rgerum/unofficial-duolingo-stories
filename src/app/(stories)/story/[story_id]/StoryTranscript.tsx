import { cn } from "@/lib/utils";
import type {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import StoryHeaderProgress from "@/components/StoryHeaderProgress";
import type { StoryData } from "./getStory";
import {
  getStoryDescription,
  getStoryTranscript,
  getSpeakerName,
} from "./story_seo";

export default function StoryTranscript({ story }: { story: StoryData }) {
  const transcript = getStoryTranscript(story);
  const description = getStoryDescription(story);
  const header = story.elements.find(
    (element: StoryElement): element is StoryElementHeader =>
      element.type === "HEADER",
  );
  const lines = story.elements.filter(
    (element: StoryElement): element is StoryElementLine =>
      element.type === "LINE",
  );
  const progressLength = Math.max(lines.length, 1);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.from_language_name,
    description,
    inLanguage: story.learning_language,
    about: [
      `${story.learning_language_long} learning`,
      `${story.from_language_long} reading practice`,
    ],
    isPartOf: {
      "@type": "WebSite",
      name: "Duostories",
      url: "https://duostories.org",
    },
    mainEntityOfPage: `https://duostories.org/story/${story.id}`,
    articleBody: transcript.map((line) => line.text).join("\n"),
  };

  return (
    <section aria-labelledby="story-transcript-heading" className="pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StoryHeaderProgress
        course={story.course_short}
        setId={story.set_id}
        progress={0}
        length={progressLength}
      />
      <div
        className={cn(
          "mx-auto max-w-[500px] p-4",
          story.learning_language_rtl && "[direction:rtl]",
        )}
      >
        {header ? (
          <div className="mb-8 text-center">
            <img
              alt="title image"
              className="mx-auto block h-[175px] w-[175px]"
              src={header.illustrationUrl}
            />
            <h1
              id="story-transcript-heading"
              className="mt-[18px] mb-0 text-[25px] leading-[34px] font-bold"
            >
              {header.learningLanguageTitleContent.text}
            </h1>
          </div>
        ) : (
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--title-color-dim)]">
              Story Text
            </p>
            <h1
              id="story-transcript-heading"
              className="m-0 text-[1.7rem] font-bold leading-tight text-[var(--title-color)]"
            >
              {story.from_language_name}
            </h1>
          </div>
        )}
        <div className="space-y-5">
          {lines.map((line: StoryElementLine, index: number) => (
            <ReadOnlyStoryLine key={`${story.id}-${index}`} line={line} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReadOnlyStoryLine({ line }: { line: StoryElementLine }) {
  const isRtl = line.lang === "rtl";

  if (line.line.type === "TITLE") {
    return (
      <div className={line.lang}>
        <h2 className="m-0 text-[25px] leading-[34px] font-bold">
          {line.line.content.text}
        </h2>
      </div>
    );
  }

  if (line.line.type === "CHARACTER" && line.line.avatarUrl) {
    const speakerName = getSpeakerName(line) ?? "Narrator";

    return (
      <div className={cn("my-5 flex flex-nowrap items-start", line.lang)}>
        <img
          className={cn(
            "mr-[18px] flex h-[50px] w-[50px] flex-[0_0_50px]",
            isRtl && "mr-0 ml-3 scale-x-[-1]",
          )}
          src={line.line.avatarUrl}
          alt={speakerName}
        />
        <span
          className={cn(
            "relative inline-block w-max max-w-[80%] rounded-[0_14px_14px_14px] border-2 border-[var(--color_base_border)] bg-[var(--color_base_background)] px-3 py-[10px]",
            "before:absolute before:top-[-2px] before:left-[-14px] before:content-[''] before:border-r-[12px] before:border-b-[12px] before:border-r-[var(--color_base_border)] before:border-b-transparent",
            "after:absolute after:top-0 after:left-[-9px] after:content-[''] after:border-r-[12px] after:border-b-[12px] after:border-r-[var(--color_base_background)] after:border-b-transparent",
            isRtl &&
              "rounded-tl-[14px] rounded-tr-none before:left-auto before:right-[-14px] before:border-r-0 before:border-l-[12px] before:border-l-[var(--color_base_border)] after:left-auto after:right-[-9px] after:border-r-0 after:border-l-[12px] after:border-l-[var(--color_base_background)]",
          )}
        >
          <span>{line.line.content.text}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn("my-5 text-[20px] leading-[30px]", line.lang)}>
      <span>{line.line.content.text}</span>
    </div>
  );
}
