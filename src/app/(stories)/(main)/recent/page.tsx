import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Recently published stories | Duostories",
  description:
    "See the latest community-translated language learning stories published on Duostories.",
  alternates: { canonical: "https://duostories.org/recent" },
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

export default async function RecentStoriesPage() {
  const stories = await fetchQuery(
    api.recentStories.getRecentPublishedStories,
    {},
  );

  return (
    <div className="mx-auto w-full max-w-[760px] py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="m-0 text-[calc(32/16*1rem)] leading-tight">
          Recently published stories
        </h1>
        <p className="mx-auto mt-3 max-w-[580px] text-[var(--text-color-dim)]">
          The latest stories translated and published by the Duostories
          community.
        </p>
      </header>

      {stories.length === 0 ? (
        <p className="rounded-2xl border-2 border-[var(--overview-hr)] p-8 text-center text-[var(--text-color-dim)]">
          No recently published stories yet.
        </p>
      ) : (
        <ol className="m-0 grid list-none gap-4 p-0">
          {stories.map((story) => (
            <li key={story.id}>
              <Link
                href={`/story/${story.id}`}
                className="group flex min-h-[132px] items-center gap-4 rounded-2xl border-2 border-b-4 border-[var(--overview-hr)] bg-[var(--body-background)] p-4 no-underline transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:gap-6 sm:p-5"
              >
                <div
                  className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl sm:h-[104px] sm:w-[104px]"
                  style={{ backgroundColor: `#${story.activeLip}` }}
                >
                  <Image
                    src={story.active}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 92px, 104px"
                    className="object-contain transition-transform duration-300 group-hover:-translate-y-0.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <time
                    dateTime={new Date(story.datePublished).toISOString()}
                    className="text-[calc(13/16*1rem)] font-bold tracking-[0.08em] text-[var(--text-color-dim)] uppercase"
                  >
                    {dateFormatter.format(story.datePublished)}
                  </time>
                  <h2 className="my-1 text-[calc(21/16*1rem)] leading-tight text-[var(--text-color)]">
                    {story.name}
                  </h2>
                  <p className="m-0 text-[calc(15/16*1rem)] leading-snug text-[var(--text-color-dim)]">
                    {story.course.name}
                    {story.course.fromLanguageName
                      ? ` · for ${story.course.fromLanguageName} speakers`
                      : ""}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="hidden text-2xl font-bold text-[var(--text-color-dim)] sm:block"
                >
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
