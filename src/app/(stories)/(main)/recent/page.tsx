import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Recently published stories | Duostories",
  description:
    "See the latest community-translated language learning story sets published on Duostories.",
  alternates: { canonical: "https://duostories.org/recent" },
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

export default async function RecentStoriesPage() {
  const publishedSets = await fetchQuery(
    api.recentStories.getRecentPublishedStorySets,
    {},
  );

  return (
    <div className="mx-auto w-full max-w-[760px] py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="m-0 text-[calc(32/16*1rem)] leading-tight">
          Recent activity
        </h1>
        <p className="mx-auto mt-3 max-w-[580px] text-[var(--text-color-dim)]">
          The latest story sets published by the Duostories community.
        </p>
      </header>

      {publishedSets.length === 0 ? (
        <p className="rounded-2xl border-2 border-[var(--overview-hr)] p-8 text-center text-[var(--text-color-dim)]">
          No recently published story sets yet.
        </p>
      ) : (
        <ol className="m-0 grid list-none gap-5 p-0">
          {publishedSets.map((publishedSet) => {
            const courseLabel = `${publishedSet.course.learningLanguageName} from ${publishedSet.course.fromLanguageName}`;
            return (
              <li
                key={`${publishedSet.course.courseSlug}-${publishedSet.setId}-${publishedSet.datePublished}`}
                className="rounded-2xl border-2 border-b-4 border-[var(--overview-hr)] bg-[var(--body-background)] p-4 sm:p-5"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div>
                    <time
                      dateTime={new Date(
                        publishedSet.datePublished,
                      ).toISOString()}
                      className="text-[calc(13/16*1rem)] font-bold tracking-[0.08em] text-[var(--text-color-dim)] uppercase"
                    >
                      {dateFormatter.format(publishedSet.datePublished)}
                    </time>
                    <h2 className="my-1 text-[calc(22/16*1rem)] leading-tight">
                      {publishedSet.stories.length} stories published
                    </h2>
                  </div>
                  <Link
                    href={`/${publishedSet.course.courseSlug}`}
                    className="font-bold text-[var(--duostories-title)] underline decoration-2 underline-offset-4"
                  >
                    {courseLabel}
                  </Link>
                  {publishedSet.course.seriesTitle && (
                    <p className="m-0 w-full text-[calc(14/16*1rem)] text-[var(--text-color-dim)] sm:text-right">
                      {publishedSet.course.seriesTitle}
                    </p>
                  )}
                </div>

                <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                  {publishedSet.stories.map((story) => (
                    <li key={story.id}>
                      <Link
                        href={`/story/${story.id}`}
                        className="group flex min-h-[78px] items-center gap-3 rounded-xl p-2 no-underline transition-colors hover:bg-[var(--overview-hr)]"
                      >
                        <div
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                          style={{ backgroundColor: `#${story.activeLip}` }}
                        >
                          <Image
                            src={story.active}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-contain transition-transform duration-300 group-hover:-translate-y-0.5"
                          />
                        </div>
                        <span className="text-[calc(16/16*1rem)] leading-tight font-bold">
                          {story.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
