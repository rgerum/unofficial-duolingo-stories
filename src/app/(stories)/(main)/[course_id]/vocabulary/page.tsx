import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@convex/_generated/api";

import Header from "../../header";
import { analyzeCourseVocabulary } from "@/lib/course-vocabulary";
import { fetchAuthQuery } from "@/lib/auth-server";
import { requireAdmin } from "@/lib/userInterface";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: string }>;
}): Promise<Metadata> {
  const { course_id: courseId } = await params;
  return {
    title: `Course vocabulary | Duostories`,
    description: `See how the unique vocabulary grows throughout the ${courseId} Duostories course.`,
    alternates: { canonical: `https://duostories.org/${courseId}/vocabulary` },
    robots: { index: false, follow: false },
  };
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--overview-hr)] p-4 text-center">
      <strong className="block text-3xl">{value.toLocaleString()}</strong>
      <span className="text-sm text-[var(--text-color-dim)]">{label}</span>
    </div>
  );
}

function GrowthChart({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const width = 700;
  const height = 240;
  const padding = 28;
  const maximum = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - (value / maximum) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <figure className="m-0 mt-8">
      <figcaption className="mb-3 font-bold">
        Unique vocabulary through the course
      </figcaption>
      <svg
        className="h-auto w-full overflow-visible rounded-xl border border-[var(--overview-hr)] bg-[var(--body-background-faint)]"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Cumulative unique word count rises from ${values[0]?.toLocaleString()} after the first story to ${values.at(-1)?.toLocaleString()} after the last story.`}
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--overview-hr)"
          strokeWidth="2"
        />
        <polyline
          points={points}
          fill="none"
          stroke="var(--link-blue)"
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </figure>
  );
}

export default async function VocabularyPage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const { course_id: courseId } = await params;
  if (!courseId.includes("-") || courseId.includes(".")) notFound();

  await requireAdmin();
  const course = await fetchAuthQuery(
    api.vocabulary.getCourseVocabularySourceForAdmin,
    {
      short: courseId,
    },
  );
  if (!course) notFound();

  const analysis = analyzeCourseVocabulary(course.stories);
  const languageName = course.name || course.learningLanguageName;
  const alphabeticalWords = [...analysis.words].sort((a, b) =>
    a.localeCompare(b, courseId.split("-")[0]),
  );

  return (
    <>
      <Header>
        <h1>{languageName} course vocabulary</h1>
        <p>
          See which words appear in the story dialogue and how the vocabulary
          grows as you move through the course.
        </p>
      </Header>
      <div className="mx-auto mb-12 w-full max-w-[720px]">
        <Link
          href={`/${courseId}`}
          className="font-bold text-[var(--link-blue)] no-underline"
        >
          ← Back to the course
        </Link>

        <div className="mt-6 grid grid-cols-3 gap-3 max-[560px]:grid-cols-1">
          <Stat value={analysis.uniqueWordCount} label="unique words" />
          <Stat value={analysis.totalWordCount} label="words in total" />
          <Stat value={analysis.stories.length} label="stories analyzed" />
        </div>

        <p className="mt-4 text-sm text-[var(--text-color-dim)]">
          Counts use the spoken story lines, ignore capitalization and
          punctuation, and count different forms of a word separately.
        </p>

        <GrowthChart
          values={analysis.stories.map((story) => story.cumulativeUniqueWords)}
        />

        <section className="mt-9" aria-labelledby="story-growth-heading">
          <h2 id="story-growth-heading" className="text-2xl font-bold">
            Growth by story
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--overview-hr)]">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[var(--body-background-faint)] text-sm">
                <tr>
                  <th className="p-3">Story</th>
                  <th className="p-3 text-right">New</th>
                  <th className="p-3 text-right">Total unique</th>
                </tr>
              </thead>
              <tbody>
                {analysis.stories.map((story, index) => (
                  <tr
                    key={story.id}
                    className="border-t border-[var(--overview-hr)]"
                  >
                    <td className="p-3">
                      <Link
                        href={`/story/${story.id}`}
                        className="font-bold text-[var(--link-blue)]"
                      >
                        {index + 1}. {story.name}
                      </Link>
                      <details className="mt-1 text-sm">
                        <summary className="cursor-pointer text-[var(--text-color-dim)]">
                          Show {story.newWords.length.toLocaleString()} new
                          words
                        </summary>
                        <p className="mt-2 leading-7">
                          {story.newWords.length > 0
                            ? story.newWords.join(" · ")
                            : "No new words in this story."}
                        </p>
                      </details>
                    </td>
                    <td className="p-3 text-right align-top font-bold">
                      +{story.newWords.length.toLocaleString()}
                    </td>
                    <td className="p-3 text-right align-top">
                      {story.cumulativeUniqueWords.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <details className="mt-8 rounded-xl border border-[var(--overview-hr)] p-4">
          <summary className="cursor-pointer text-xl font-bold">
            Complete word list ({analysis.uniqueWordCount.toLocaleString()})
          </summary>
          <p className="mt-4 leading-8">{alphabeticalWords.join(" · ")}</p>
        </details>
      </div>
    </>
  );
}
