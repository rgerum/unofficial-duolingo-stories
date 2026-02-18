"use client";

import React from "react";
import { api } from "@convex/_generated/api";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import Link from "next/link";
import Header from "../header";
import StoryButton from "./story_button";
import get_localisation_func from "@/lib/get_localisation_func";
import Switch from "@/components/layout/switch";
import {
  createCustomStoryPlaylist,
  deleteCustomStoryPlaylist,
  listCustomStoryPlaylists,
  toggleStoryInCustomPlaylist,
  type CustomStoryPlaylist,
} from "@/lib/storyPlaylists";

function SetTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-[1/-1] w-full overflow-x-hidden text-center text-[calc(27/16*1rem)] font-bold flex before:flex-1 after:flex-1 items-center before:relative before:right-4 before:-ml-1/2 before:inline-block before:h-[2px] before:w-1/2 before:align-middle before:bg-[var(--overview-hr)] before:content-[''] after:relative after:left-4 after:-mr-1/2 after:inline-block after:h-[2px] after:w-1/2 after:align-middle after:bg-[var(--overview-hr)] after:content-[''] max-[480px]:text-[calc(22/16*1rem)]">
      {children}
    </div>
  );
}

function SetGrid({
  setName,
  children,
}: {
  setName: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ol className="m-0 mx-auto grid max-w-[720px] list-none grid-cols-[repeat(auto-fill,clamp(140px,50%,180px))] justify-center justify-items-center p-0">
      <SetTitle>{setName}</SetTitle>
      {children}
    </ol>
  );
}

function About({ about }: { about: string }) {
  if (!about) return <></>;
  return (
    <div className="mx-auto max-w-[720px]">
      <SetTitle>About</SetTitle>
      <p>{about}</p>
    </div>
  );
}

export default function CoursePageClient({
  course_id,
  preloadedCourse,
}: {
  course_id: string;
  preloadedCourse: Preloaded<typeof api.landing.getPublicCoursePageData>;
}) {
  const listeningStorageKey = React.useMemo(
    () => `course_listening_mode:${course_id}`,
    [course_id],
  );
  const [listeningMode, setListeningMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setListeningMode(window.localStorage.getItem(listeningStorageKey) === "1");
  }, [listeningStorageKey]);

  const toggleListeningMode = React.useCallback(() => {
    setListeningMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(listeningStorageKey, next ? "1" : "0");
      }
      return next;
    });
  }, [listeningStorageKey]);

  const course = usePreloadedQuery(preloadedCourse);
  const localizationMap = React.useMemo(() => {
    const data: Record<string, string> = {};
    for (const row of course?.localization ?? []) data[row.tag] = row.text;
    return data;
  }, [course]);
  const localization = React.useMemo(
    () => get_localisation_func(localizationMap),
    [localizationMap],
  );

  const doneStoryIds = useQuery(
    api.storyDone.getDoneStoryIdsForCurrentUserInCourse,
    { courseShort: course_id },
  );
  const doneMap = React.useMemo(() => {
    const done: Record<number, boolean> = {};
    for (const storyId of doneStoryIds ?? []) done[storyId] = true;
    return done;
  }, [doneStoryIds]);

  const storiesBySet = React.useMemo(() => {
    if (!course) return [];
    const grouped: Record<number, typeof course.stories> = {};
    for (const story of course.stories) {
      if (!grouped[story.set_id]) grouped[story.set_id] = [];
      grouped[story.set_id].push(story);
    }
    return Object.entries(grouped)
      .map(([setId, stories]) => ({
        setId: Number.parseInt(setId, 10),
        stories: stories.sort((a, b) => a.set_index - b.set_index),
      }))
      .sort((a, b) => a.setId - b.setId);
  }, [course]);

  const [playlists, setPlaylists] = React.useState<CustomStoryPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = React.useState("");
  const [newPlaylistName, setNewPlaylistName] = React.useState("");

  const refreshPlaylists = React.useCallback((courseShort: string) => {
    const next = listCustomStoryPlaylists(courseShort);
    setPlaylists(next);
    setSelectedPlaylistId((current) => {
      if (current && next.some((playlist) => playlist.id === current)) {
        return current;
      }
      return next[0]?.id ?? "";
    });
  }, []);

  React.useEffect(() => {
    refreshPlaylists(course_id);
  }, [course_id, refreshPlaylists]);

  const selectedPlaylist = React.useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  if (!course) {
    return (
      <Header>
        <h1>Course not found.</h1>
      </Header>
    );
  }

  return (
    <>
      <Header>
        <h1>
          {localization("course_page_title", {
            $language: course.learning_language_name,
          }) ?? `${course.learning_language_name} Duolingo Stories`}
        </h1>
        <p>
          {localization("course_page_sub_title", {
            $language: course.learning_language_name,
            $count: `${course.count}`,
          }) ??
            `Learn ${course.learning_language_name} with ${course.count} stories.`}
        </p>
        <p className="[&_a]:underline [&_a]:underline-offset-2">
          {localization("course_page_discuss", {}, [
            "https://discord.gg/4NGVScARR3",
            "/faq",
          ])}
        </p>
      </Header>
      <div>
        <div
          className="mx-auto mb-6 flex w-full max-w-[720px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--overview-hr)] px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--overview-hr)]"
          role="button"
          tabIndex={0}
          aria-pressed={listeningMode}
          onClick={toggleListeningMode}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleListeningMode();
            }
          }}
        >
          <div>
            <div className="font-bold">Listening mode (skip questions)</div>
            <div className="text-[calc(13/16*1rem)] text-[var(--text-color-dim)]">
              Opens stories in autoplay and skips interactive questions.
            </div>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Switch checked={listeningMode} onClick={toggleListeningMode} />
          </div>
        </div>
        <div className="mx-auto mb-6 flex w-full max-w-[720px] flex-col gap-3 rounded-xl border border-[var(--overview-hr)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold">Custom playlists</div>
              <div className="text-[calc(13/16*1rem)] text-[var(--text-color-dim)]">
                Build your own queue and play it in auto-play mode.
              </div>
            </div>
            {course.stories[0] ? (
              <Link
                href={`/story/${course.stories[0].id}/auto_play?mode=course&loop=off&shuffle=0`}
                className="rounded border border-[var(--overview-hr)] px-3 py-1.5 text-[calc(13/16*1rem)] font-bold no-underline hover:bg-black/5"
              >
                Auto-play whole course
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={newPlaylistName}
              onChange={(event) => setNewPlaylistName(event.target.value)}
              placeholder="New playlist name"
              className="min-w-[220px] flex-1 rounded border border-[var(--overview-hr)] px-3 py-2 text-[calc(14/16*1rem)]"
            />
            <button
              type="button"
              className="rounded border border-[var(--overview-hr)] px-3 py-2 text-[calc(13/16*1rem)] font-bold hover:bg-black/5"
              onClick={() => {
                const created = createCustomStoryPlaylist(course_id, newPlaylistName);
                if (!created) return;
                setNewPlaylistName("");
                refreshPlaylists(course_id);
                setSelectedPlaylistId(created.id);
              }}
            >
              Create playlist
            </button>
          </div>
          {playlists.length > 0 ? (
            <div className="flex flex-col gap-2">
              {playlists.map((playlist) => {
                const firstStoryId = playlist.storyIds.find((storyId) =>
                  course.stories.some((story) => story.id === storyId),
                );
                const selected = playlist.id === selectedPlaylistId;
                return (
                  <div
                    key={playlist.id}
                    className={
                      "flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 " +
                      (selected ? "border-emerald-400 bg-emerald-50/60" : "border-[var(--overview-hr)]")
                    }
                  >
                    <button
                      type="button"
                      className="text-left text-[calc(14/16*1rem)] font-bold"
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                    >
                      {playlist.name} ({playlist.storyIds.length})
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      {firstStoryId ? (
                        <Link
                          href={`/story/${firstStoryId}/auto_play?mode=custom&playlistId=${playlist.id}&loop=off&shuffle=0`}
                          className="rounded border border-[var(--overview-hr)] px-2 py-1 text-[calc(12/16*1rem)] font-bold no-underline hover:bg-black/5"
                        >
                          Play
                        </Link>
                      ) : (
                        <span className="text-[calc(12/16*1rem)] text-[var(--text-color-dim)]">
                          Empty
                        </span>
                      )}
                      <button
                        type="button"
                        className="rounded border border-red-300 px-2 py-1 text-[calc(12/16*1rem)] font-bold text-red-700 hover:bg-red-50"
                        onClick={() => {
                          deleteCustomStoryPlaylist(playlist.id);
                          refreshPlaylists(course_id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[calc(13/16*1rem)] text-[var(--text-color-dim)]">
              No playlists yet. Create one, then add stories below.
            </div>
          )}
          {selectedPlaylist ? (
            <div className="text-[calc(12/16*1rem)] text-[var(--text-color-dim)]">
              Editing playlist: <strong>{selectedPlaylist.name}</strong>
            </div>
          ) : null}
        </div>
        {course.about ? <About about={course.about} /> : null}
        {storiesBySet.map((set) => (
          <SetGrid
            key={set.setId}
            setName={
              <span className="inline-flex items-center gap-3">
                <span>
                  {localization("set_n", { $count: `${set.setId}` }) ??
                    `Set ${set.setId}`}
                </span>
                {set.stories[0] ? (
                  <Link
                    href={`/story/${set.stories[0].id}/auto_play?mode=set&setId=${set.setId}&loop=off&shuffle=0`}
                    className="rounded border border-[var(--overview-hr)] px-2 py-1 text-[calc(12/16*1rem)] font-bold no-underline hover:bg-black/5"
                  >
                    Play set
                  </Link>
                ) : null}
              </span>
            }
          >
            {set.stories.map((story) => (
              <li key={story.id}>
                <StoryButton
                  story={story}
                  done={doneMap[story.id]}
                  listeningMode={listeningMode}
                />
                {selectedPlaylist ? (
                  <div className="mt-1 text-center">
                    <button
                      type="button"
                      className="rounded border border-[var(--overview-hr)] px-2 py-1 text-[calc(12/16*1rem)] font-bold hover:bg-black/5"
                      onClick={() => {
                        toggleStoryInCustomPlaylist(selectedPlaylist.id, story.id);
                        refreshPlaylists(course_id);
                      }}
                    >
                      {selectedPlaylist.storyIds.includes(story.id)
                        ? "Remove from playlist"
                        : "Add to playlist"}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </SetGrid>
        ))}
      </div>
    </>
  );
}
