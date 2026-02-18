"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SpinnerBlue } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  CourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";

export default function EditList({
  stories,
  course,
}: {
  stories: StoryListDataProps[];
  course: CourseProps;
}) {
  if (stories === undefined) stories = [];
  let set_ends = [];
  let last_set = 1;
  let story_published_count = 0;
  for (let story of stories) {
    if (story.set_id === last_set) set_ends.push(0);
    else set_ends.push(1);
    last_set = story.set_id;
    story_published_count += story.public ? 1 : 0;
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
        <Link className="underline" href={`/editor/language/${course.short}`}>
          Character Editor
        </Link>
        .
      </p>
      {course.from_language_name !== "English" && (
        <p className="my-4">
          For language localization settings (for the base language of this
          course), head to the{" "}
          <Link className="underline" href={`/editor/localization/${course.short}`}>
            Localization Editor
          </Link>
          .
        </p>
      )}
      <p className="my-4 font-bold">
        Active Contributors:{" "}
        {course.contributors.map((d, i) => (
          <span key={i}>{d}, </span>
        ))}{" "}
        {course.contributors.length === 0 ? "No Contributors" : ""}
      </p>
      <p className="my-4">
        Past Contributors:{" "}
        {course.contributors_past.map((d, i) => (
          <span key={i}>{d}, </span>
        ))}
      </p>
      <div className="mb-[100px] w-full min-[1000px]:table min-[1000px]:border-collapse min-[1000px]:align-middle">
        <div className="hidden min-[1000px]:table-header-group">
          <div className="min-[1000px]:table-row">
            <div className="bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell" data-js-sort-colnum="0">Set</div>
            <div className="bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell"></div>
            <div className="bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell" data-js-sort-colnum="1">Name</div>
            <div className="bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell" data-js-sort-colnum="2">Status</div>
            <div className="bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell" data-js-sort-colnum="4">Author</div>
            <div className="js-sort-active bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell" data-js-sort-colnum="5">Created</div>
            <div className="bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell" data-js-sort-colnum="6">Author</div>
            <div className="bg-[var(--button-background)] px-[5px] pb-[5px] pt-[5px] text-left text-[var(--button-color)] min-[1000px]:table-cell" data-js-sort-colnum="7">Updated</div>
          </div>
        </div>
        <div className="min-[1000px]:table-row-group">
          {stories.map((story, i) => (
            <div
              className={
                "items-center py-[5px] transition-[filter,color,background-color] duration-100 ease-in hover:bg-[var(--body-background)] hover:brightness-90 max-[1000px]:flex max-[1000px]:flex-wrap min-[1000px]:table-row " +
                (i % 2 === 1 ? "bg-[var(--body-background-faint)] " : "") +
                (set_ends[i] ? "border-t-[3px] border-[var(--button-background)] " : "")
              }
              key={story.id}
            >
              <div className="overflow-hidden text-ellipsis whitespace-nowrap max-[1000px]:w-[60px] min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px]">
                <span>
                  <b>{pad_space(story.set_id)}</b>&nbsp;-&nbsp;
                  {pad_space(story.set_index)}
                </span>
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap max-[1000px]:w-[45px] min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px]">
                <img
                  alt={"story title"}
                  src={
                    "https://stories-cdn.duolingo.com/image/" +
                    story.image +
                    ".svg"
                  }
                  width="44px"
                  height={"40px"}
                />
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap pl-[5px] max-[1000px]:w-[calc(100vw-60px-45px-180px)] max-[500px]:w-[calc(100vw-60px-45px-85px)] min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px]">
                <Link className="underline underline-offset-2" href={`/editor/story/${story.id}`}>
                  {story.name}
                </Link>
                {story.todo_count ? (
                  <img
                    title={`This story has ${story.todo_count} TODOs.`}
                    alt="error"
                    src="/editor/icons/error.svg"
                  />
                ) : null}
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-right max-[1000px]:w-[180px] max-[500px]:w-[85px] max-[500px]:[&>div]:flex max-[500px]:overflow-hidden min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px]">
                <DropDownStatus
                  id={story.id}
                  name={story.name}
                  count={story.approvalCount ?? 0}
                  status={story.status}
                  public={story.public}
                  official={course.official}
                />
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap pl-[5px] text-[12px] text-[var(--text-color-dim)] before:content-['Created:_'] max-[1000px]:w-[calc(50%-130px)] max-[500px]:w-[calc(100%-130px)] min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)] min-[1000px]:before:content-none">{story.author}</div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[var(--text-color-dim)] max-[1000px]:w-[130px] min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)]">{formatDate(story.date)}</div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap pl-[5px] text-[12px] text-[var(--text-color-dim)] before:content-['Changed:_'] max-[1000px]:w-[calc(50%-130px)] max-[500px]:w-[calc(100%-130px)] min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)] min-[1000px]:before:content-none">{story.author_change}</div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[var(--text-color-dim)] max-[1000px]:w-[130px] min-[1000px]:table-cell min-[1000px]:align-middle min-[1000px]:px-[5px] min-[1000px]:text-[inherit] min-[1000px]:text-[var(--text-color)]">{formatDate(story.change_date)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function pad_space(x: number) {
  if (x < 10) return " " + x;
  return x.toString();
}

function pad(x: number) {
  if (x < 10) return "0" + x;
  return x.toString();
}

function formatDate(datetime: string | number | Date) {
  let d = new Date(datetime);
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
}) {
  let [loading, setLoading] = useState(0);
  let [status, set_status] = useState(props.status);
  let [count, setCount] = useState(props.count);
  let [isPublic, setIsPublic] = useState(props.public);
  const toggleApprovalMutation = useMutation(api.storyApproval.toggleStoryApproval);
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
        setCount(count);
        if (response.published.length) {
          if (
            Array.isArray(response.published) &&
            response.published.includes(props.id)
          ) {
            setIsPublic(true);
          }
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
