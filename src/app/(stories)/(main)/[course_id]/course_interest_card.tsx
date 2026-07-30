"use client";

import { api } from "@convex/_generated/api";
import { Heart, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import React from "react";

function getAnonymousId(courseShort: string) {
  const storageKey = `course_interest_supporter:${courseShort}`;
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(storageKey, id);
  return id;
}

export default function CourseInterestCard({
  courseShort,
  languageName,
  completedAll,
}: {
  courseShort: string;
  languageName: string;
  completedAll: boolean;
}) {
  const [anonymousId, setAnonymousId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const setInterest = useMutation(api.courseInterest.setForLearner);
  const interest = useQuery(
    api.courseInterest.getForLearner,
    anonymousId ? { courseShort, anonymousId } : "skip",
  );

  React.useEffect(() => {
    setAnonymousId(getAnonymousId(courseShort));
  }, [courseShort]);

  const interested = interest?.interested ?? false;

  async function toggleInterest() {
    if (!anonymousId || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await setInterest({
        courseShort,
        anonymousId,
        interested: !interested,
      });
    } catch (cause) {
      console.error("Failed to update course interest", cause);
      setError("That didn’t work. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="relative mx-auto mt-10 mb-6 max-w-[720px] overflow-hidden rounded-[22px] border-2 border-[#8fd55c] bg-[linear-gradient(145deg,#f4ffe9_0%,#ffffff_58%,#efffe8_100%)] px-5 py-6 text-center shadow-[0_5px_0_#8fd55c] dark:border-[#4f8d35] dark:bg-[linear-gradient(145deg,#20331d_0%,#18231a_58%,#1d2d1b_100%)] dark:shadow-[0_5px_0_#315d24] sm:px-8 sm:py-8">
      <Sparkles
        aria-hidden="true"
        className="absolute top-4 right-5 h-5 w-5 rotate-12 text-[#58a700]"
      />
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#d9ffc2] text-[#58a700] dark:bg-[#315d24] dark:text-[#8ee45b]">
        <Heart className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-[calc(22/16*1rem)] font-bold leading-tight">
        {completedAll
          ? `You finished every ${languageName} story!`
          : `Want more ${languageName} stories?`}
      </h2>
      <p className="mx-auto mt-2 max-w-[500px] text-[var(--text-color-dim)]">
        {completedAll
          ? "Let the volunteer contributor team know you’re ready for another one."
          : "Your signal helps volunteer contributors see that learners are waiting for more."}
      </p>
      <button
        type="button"
        disabled={!anonymousId || interest === undefined || isSaving}
        aria-pressed={interested}
        onClick={toggleInterest}
        className={`mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 py-3 font-bold transition-[transform,background-color,border-color,box-shadow] active:translate-y-[2px] disabled:cursor-wait disabled:opacity-60 ${
          interested
            ? "border-[#77b255] bg-white text-[#3f7d1d] shadow-[0_4px_0_#77b255] dark:bg-[#263625] dark:text-[#a6e582]"
            : "border-[#58a700] bg-[#58cc02] text-white shadow-[0_4px_0_#58a700] hover:bg-[#61d909]"
        }`}
      >
        <Heart
          className={`h-5 w-5 ${interested ? "fill-current" : ""}`}
          aria-hidden="true"
        />
        {isSaving
          ? "Saving…"
          : interested
            ? "I’m interested"
            : "I’d love more stories"}
      </button>
      {interested ? (
        <p className="mt-4 text-[calc(13/16*1rem)] text-[var(--text-color-dim)]">
          We’ll share this interest with the contributor team.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-[calc(14/16*1rem)] font-bold text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
