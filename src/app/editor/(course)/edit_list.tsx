"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SpinnerBlue } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import ContributorList from "@/components/ContributorList";
import {
  readCourseFilter,
  rememberCourseFilter,
  rememberCourseScrollPosition,
  restoreCourseScrollPosition,
} from "./course_view_memory";
import type {
  DetailedCourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";

type StoryState = "draft" | "feedback" | "finished" | "published";
type StoryFilter = "all" | StoryState;

const STORY_FILTER_ORDER: StoryFilter[] = [
  "all",
  "draft",
  "feedback",
  "finished",
  "published",
];

export default function EditList({
  stories,
  course,
}: {
  stories: StoryListDataProps[];
  course: DetailedCourseProps;
}) {
  const courseStorageKey = course.short ?? String(course.id);
  const [storyList, setStoryList] = useState<StoryListDataProps[]>(
    stories ?? [],
  );
  const [activeFilter, setActiveFilter] = useState<StoryFilter>("all");
  const [isStoredFilterApplied, setIsStoredFilterApplied] = useState(false);
  const restoredViewKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setStoryList(stories ?? []);
  }, [stories]);

  useLayoutEffect(() => {
    restoredViewKeyRef.current = null;
    setIsStoredFilterApplied(false);

    const storedFilter = readCourseFilter(courseStorageKey) ?? "all";
    setActiveFilter(storedFilter);
    setIsStoredFilterApplied(true);
  }, [courseStorageKey]);

  useEffect(() => {
    if (!isStoredFilterApplied) return;
    rememberCourseFilter(courseStorageKey, activeFilter);
  }, [activeFilter, courseStorageKey, isStoredFilterApplied]);

  useLayoutEffect(() => {
    if (!isStoredFilterApplied) return;

    const viewKey = `${courseStorageKey}:${activeFilter}`;
    if (restoredViewKeyRef.current === viewKey) return;

    restoredViewKeyRef.current = viewKey;
    return restoreCourseScrollPosition(courseStorageKey);
  }, [activeFilter, courseStorageKey, isStoredFilterApplied]);

  const counts = storyList.reduce<Record<StoryFilter, number>>(
    (acc, story) => {
      acc.all += 1;
      acc[getStoryState(story)] += 1;
      return acc;
    },
    {
      all: 0,
      draft: 0,
      feedback: 0,
      finished: 0,
      published: 0,
    },
  );

  const filteredStories =
    activeFilter === "all"
      ? storyList
      : storyList.filter((story) => getStoryState(story) === activeFilter);

  let set_ends = [];
  // Seed with the first visible story's set so the first rendered row does not
  // get a divider; only transitions between sets should add the border.
  let last_set = filteredStories[0]?.set_id;
  let story_published_count = 0;
  for (let story of storyList) {
    story_published_count += story.public ? 1 : 0;
  }

  for (let story of filteredStories) {
    if (story.set_id === last_set) set_ends.push(0);
    else set_ends.push(1);
    last_set = story.set_id;
  }

  return (
    <>
      <div>
        {!course.public && story_published_count ? (
          <div className="mx-[10px] my-[10px] rounded-[10px] border-2 bg-[var(--button-inactive-background)] p-[10px]">
            {`⚠ This course is not public, but has ${story_published_count} stories set to "public".`}
            <br />
            Please ask a moderator on discord to check the course and make it
            public.
          </div>
        ) : null}
        <ul className="my-4 list-disc pl-10">
          <li>
            To create a new story click the &quot;Import&quot; button. The story
            starts as &quot;✍️ draft&quot;.
          </li>
          <li>
            When you have finished working on the story, click the
            &quot;👍&quot; icon to approve it and change the status to &quot;🗨
            feedback&quot;.
          </li>
          <li>
            Now tell contributors on Discord to check the story. When one or
            more people have checked the story and also gave their approval
            &quot;👍&quot; the status changes to &quot;✅ finished&quot;.
          </li>
          <li>
            When one complete set is finished it will switch to &quot;📢
            published&quot;.
          </li>
        </ul>
      </div>
      <p className="my-4">
        To set character voices, go to the{" "}
        <Link
          className="underline"
          href={`/editor/course/${course.short}/voices`}
        >
          Character Editor
        </Link>
        .
      </p>
      {course.from_language_name !== "English" && (
        <p className="my-4">
          For language localization settings (for the base language of this
          course), head to the{" "}
          <Link
            className="underline"
            href={`/editor/course/${course.short}/localization`}
          >
            Localization Editor
          </Link>
          .
        </p>
      )}
      <div className="my-6 space-y-4">
        <div>
          <h2 className="mb-2 font-bold">Active Contributors</h2>
          <ContributorList
            contributors={course.contributors}
            emptyLabel="No contributors"
            size="sm"
          />
        </div>
        <div>
          <h2 className="mb-2 font-bold">Past Contributors</h2>
          <ContributorList
            contributors={course.contributors_past}
            emptyLabel="No past contributors"
            muted
            size="sm"
          />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {STORY_FILTER_ORDER.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              className={
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[14px] leading-none transition-colors duration-150 " +
                (isActive
                  ? "border-[var(--button-background)] bg-[var(--button-background)] text-[var(--button-color)]"
                  : "border-[var(--header-border)] bg-[var(--body-background-faint)] text-[var(--text-color)] hover:bg-[var(--body-background)]")
              }
              onClick={() => setActiveFilter(filter)}
              aria-pressed={isActive}
            >
              <span>{getFilterLabel(filter)}</span>
              <span
                className={
                  "rounded-full px-2 py-[3px] text-[12px] font-bold " +
                  (isActive
                    ? "bg-[color:rgba(255,255,255,0.18)] text-[var(--button-color)]"
                    : "bg-[var(--body-background)] text-[var(--text-color-dim)]")
                }
              >
                {counts[filter]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mb-[100px] w-full">
        <div className="hidden min-[1000px]:block">
          <div className="min-[1000px]:grid min-[1000px]:grid-cols-[84px_56px_minmax(0,1fr)_210px_120px_150px_120px_150px] min-[1000px]:items-center">
            <div
              className="flex self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"
              data-js-sort-colnum="0"
            >
              <span className="my-auto">Set</span>
            </div>
            <div className="self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"></div>
            <div
              className="flex self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"
              data-js-sort-colnum="1"
            >
              <span className="my-auto">Name</span>
            </div>
            <div
              className="flex self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"
              data-js-sort-colnum="2"
            >
              <span className="my-auto">Status</span>
            </div>
            <div
              className="flex self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"
              data-js-sort-colnum="4"
            >
              <span className="my-auto">Author</span>
            </div>
            <div
              className="js-sort-active flex self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"
              data-js-sort-colnum="5"
            >
              <span className="my-auto">Created</span>
            </div>
            <div
              className="flex self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"
              data-js-sort-colnum="6"
            >
              <span className="my-auto">Author</span>
            </div>
            <div
              className="flex self-stretch bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)]"
              data-js-sort-colnum="7"
            >
              <span className="my-auto">Updated</span>
            </div>
          </div>
        </div>
        <div>
          {filteredStories.map((story, i) => (
            <div
              className={
                "items-center py-[5px] transition-[filter,color,background-color] duration-100 ease-in hover:bg-[var(--body-background)] hover:brightness-90 max-[1000px]:flex max-[1000px]:flex-wrap min-[1000px]:grid min-[1000px]:grid-cols-[84px_56px_minmax(0,1fr)_210px_120px_150px_120px_150px] min-[1000px]:items-center " +
                (i % 2 === 1 ? "bg-[var(--body-background-faint)] " : "") +
                (set_ends[i]
                  ? "border-t-[3px] border-[var(--button-background)] "
                  : "")
              }
              key={story.id}
            >
              <div className="overflow-hidden text-ellipsis whitespace-nowrap max-[1000px]:w-[60px] min-[1000px]:px-[5px]">
                <span>
                  <b>{pad_space(story.set_id)}</b>&nbsp;-&nbsp;
                  {pad_space(story.set_index)}
                </span>
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap max-[1000px]:w-[45px] min-[1000px]:px-[5px]">
                <img
                  alt={"story title"}
                  src={
                    "https://stories-cdn.duolingo.com/image/" +
                    story.image +
                    ".svg"
                  }
                  width="44px"
                  height={"40px"}
                  className="block min-w-[44px]"
                />
              </div>
              <div className="overflow-hidden pl-[5px] max-[1000px]:w-[calc(100vw-60px-45px-180px)] max-[500px]:w-[calc(100vw-60px-45px-85px)] min-[1000px]:min-w-0 min-[1000px]:px-[5px]">
                <div className="flex min-w-0 items-center gap-[6px]">
                  <Link
                    className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap underline underline-offset-2"
                    href={`/editor/course/${course.short}/story/${story.id}`}
                    title={story.name}
                    onClick={() =>
                      rememberCourseScrollPosition(courseStorageKey)
                    }
                  >
                    {story.name}
                  </Link>
                  {story.todo_count ? (
                    <span
                      title={`This story has ${story.todo_count} TODOs.`}
                      role="img"
                      aria-label={`${story.todo_count} TODOs`}
                      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-amber-100 px-[8px] py-[5px] text-[14px] leading-none font-bold text-amber-900"
                    >
                      <span aria-hidden="true">📝 {story.todo_count}</span>
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-right max-[1000px]:w-[180px] max-[500px]:w-[85px] max-[500px]:[&>div]:flex max-[500px]:overflow-hidden min-[1000px]:px-[5px]">
                <DropDownStatus
                  id={story.id}
                  name={story.name}
                  count={story.approvalCount ?? 0}
                  status={story.status}
                  public={story.public}
                  official={course.official}
                  onStoryStateChange={(nextStoryState) => {
                    setStoryList((currentStories) =>
                      currentStories.map((currentStory) =>
                        currentStory.id === story.id
                          ? { ...currentStory, ...nextStoryState }
                          : currentStory,
                      ),
                    );
                  }}
                />
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap pl-[5px] text-[12px] text-[var(--text-color-dim)] before:content-['Created:_'] max-[1000px]:w-[calc(50%-130px)] max-[500px]:w-[calc(100%-130px)] min-[1000px]:min-w-0 min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)] min-[1000px]:before:content-none">
                {story.author}
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[var(--text-color-dim)] max-[1000px]:w-[130px] min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)]">
                {formatDate(story.date)}
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap pl-[5px] text-[12px] text-[var(--text-color-dim)] before:content-['Changed:_'] max-[1000px]:w-[calc(50%-130px)] max-[500px]:w-[calc(100%-130px)] min-[1000px]:min-w-0 min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)] min-[1000px]:before:content-none">
                {story.author_change}
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[var(--text-color-dim)] max-[1000px]:w-[130px] min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)]">
                {formatDate(story.change_date)}
              </div>
            </div>
          ))}
          {filteredStories.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[var(--header-border)] bg-[var(--body-background-faint)] px-4 py-6 text-center text-[var(--text-color-dim)]">
              {getEmptyStateMessage(activeFilter)}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function getStoryState(story: Pick<StoryListDataProps, "status" | "public">) {
  if (story.public || story.status === "published") return "published";
  if (story.status === "feedback") return "feedback";
  if (story.status === "finished") return "finished";
  return "draft";
}

function getFilterLabel(filter: StoryFilter) {
  if (filter === "all") return "All";
  if (filter === "draft") return "✍️ Draft";
  if (filter === "feedback") return "🗨️ Feedback";
  if (filter === "finished") return "✅ Finished";
  return "📢 Published";
}

function getEmptyStateMessage(filter: StoryFilter) {
  if (filter === "all") return "No stories yet.";
  return "No stories match the selected state.";
}

function pad_space(x: number) {
  if (x < 10) return " " + x;
  return x.toString();
}

function pad(x: number) {
  if (x < 10) return "0" + x;
  return x.toString();
}

function formatDate(datetime: string | number | Date | undefined) {
  if (datetime === undefined || datetime === null || datetime === "") {
    return "-";
  }
  const d = new Date(datetime);
  if (Number.isNaN(d.getTime())) {
    return "-";
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function DropDownStatus(props: {
  id: number;
  name: string;
  count: number;
  status: string;
  public: boolean;
  official: boolean;
  onStoryStateChange: (
    nextStoryState: Pick<
      StoryListDataProps,
      "status" | "public" | "approvalCount"
    >,
  ) => void;
}) {
  let [loading, setLoading] = useState(0);
  let [status, set_status] = useState(props.status);
  let [count, setCount] = useState(props.count);
  let [isPublic, setIsPublic] = useState(props.public);
  const toggleApprovalMutation = useMutation(
    api.storyApproval.toggleStoryApproval,
  );
  const router = useRouter();

  useEffect(() => {
    set_status(props.status);
  }, [props.status]);

  useEffect(() => {
    setCount(props.count);
  }, [props.count]);

  useEffect(() => {
    setIsPublic(props.public);
  }, [props.public]);

  if (props.official) return <></>;

  async function addApproval() {
    const confirmed = window.confirm(
      `Did you check the story "${props.name}" and think it is ready to be published? If you want to give your approval click "ok".\n\nIn case you already gave an approval. "ok" will remove it.`,
    );
    if (!confirmed) return;

    setLoading(1);
    try {
      const response = await toggleApprovalMutation({
        legacyStoryId: props.id,
        operationKey: `story_approval:${props.id}:toggle:client`,
      });
      if (response?.count !== undefined) {
        const count = response.count;
        // Approval toggles can promote stories to published, but they do not
        // automatically unpublish them again. Reverting `public` is an admin-only
        // action, so we preserve the existing public state unless the mutation
        // explicitly reports this story as newly published.
        const nextIsPublic =
          Array.isArray(response.published) &&
          response.published.includes(props.id)
            ? true
            : isPublic;
        setCount(count);
        setIsPublic(nextIsPublic);
        props.onStoryStateChange({
          status: response.story_status,
          public: nextIsPublic,
          approvalCount: count,
        });
        if (response.published.length) {
          router.refresh();
        }
        set_status(response.story_status);
      }
      setLoading(0);
    } catch (e) {
      console.error(e);
      return setLoading(-1);
    }
  }

  function status_wrapper(status: string, public_: boolean) {
    if (props.official) return "🥇 official";
    if (public_) return "📢 published";
    if (status === "draft") return "✍️ draft";
    if (status === "finished") return "✅ finished";
    if (status === "feedback") return "🗨️ feedback";
    if (status === "published") return "📢 published";
    return status;
  }

  return (
    <div className="whitespace-nowrap">
      {
        <span className="whitespace-nowrap rounded-[10px] bg-[var(--editor-ssml)] px-[5px] py-[2px]">
          {status_wrapper(status, isPublic)}
        </span>
      }{" "}
      {loading === 1 ? (
        <SpinnerBlue />
      ) : loading === -1 ? (
        <img
          title="an error occurred"
          alt="error"
          src="/editor/icons/error.svg"
        />
      ) : (
        <></>
      )}
      {props.official ? (
        <></>
      ) : (
        <span
          className="cursor-pointer whitespace-nowrap rounded-[10px] bg-[var(--editor-ssml)] px-[5px] py-[2px] hover:brightness-90"
          onClick={addApproval}
        >
          {"👍 " + count}
        </span>
      )}
    </div>
  );
}
