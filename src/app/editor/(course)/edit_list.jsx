"use client";
import Link from "next/link";
import { useState } from "react";
import styles from "./edit_list.module.css";
import { SpinnerBlue } from "components/layout/spinner";
import { useRouter } from "next/navigation";

export default function EditList({ stories, course, updateCourses }) {
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
  console.log("course", course);

  return (
    <>
      <div>
        {!course.public && story_published_count ? (
          <div className={styles.warning}>
            ⚠ This course is not public, but has {story_published_count}{" "}
            stories set to "public".
            <br />
            Please ask a moderator on discord to check the course and make it
            pubic.
          </div>
        ) : null}
        <ul>
          <li>
            To create a new story click the "Import" button. The story starts as
            "✍️ draft".
          </li>
          <li>
            When you have finished working on the story, click the "👍" icon to
            approve it and change the status to "🗨 feedback".
          </li>
          <li>
            Now tell contributors on Discord to check the story. When one or
            more people have checked the story and also gave their approval "👍"
            the status changes to "✅ finished".
          </li>
          <li>
            When one complete set is finished it will switch to "📢 published".
          </li>
        </ul>
      </div>
      <p>
        To set character voices, go to the{" "}
        <Link href={`/editor/language/${course.short}`}>Character Editor</Link>.
      </p>
      {course.from_language_name !== "English" && (
        <p>
          For language localization settings (for the base language of this
          course), head to the{" "}
          <Link href={`/editor/localization/${course.short}`}>
            Localization Editor
          </Link>
          .
        </p>
      )}
      <p style={{ fontWeight: "bold" }}>
        Active Contributors:{" "}
        {course.contributors.map((d, i) => (
          <span key={i}>{d}, </span>
        ))}{" "}
        {course.contributors.length === 0 ? "No Contributors" : ""}
      </p>
      <p>
        Past Contributors:{" "}
        {course.contributors_past.map((d, i) => (
          <span key={i}>{d}, </span>
        ))}
      </p>
      <div className={styles.table}>
        <div className={styles.thead}>
          <div className={styles.row}>
            <div data-js-sort-colnum="0">Set</div>
            <div></div>
            <div data-js-sort-colnum="1">Name</div>
            <div data-js-sort-colnum="2">Status</div>
            <div data-js-sort-colnum="4">Author</div>
            <div data-js-sort-colnum="5" className="js-sort-active">
              Created
            </div>
            <div data-js-sort-colnum="6">Author</div>
            <div data-js-sort-colnum="7">Updated</div>
          </div>
        </div>
        <div className={styles.tbody}>
          {stories.map((story, i) => (
            <div
              className={
                styles.row + " " + (set_ends[i] ? styles.set_start : "")
              }
              key={story.id}
            >
              <div>
                <span>
                  <b>{pad_space(story.set_id)}</b>&nbsp;-&nbsp;
                  {pad_space(story.set_index)}
                </span>
              </div>
              <div style={{ width: "44px" }}>
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
              <div>
                <Link href={`/editor/story/${story.id}`}>{story.name}</Link>
                {story.todo_count ? (
                  <img
                    title={`This story has ${story.todo_count} TODOs.`}
                    alt="error"
                    src="/editor/icons/error.svg"
                  />
                ) : null}
              </div>
              <div>
                <DropDownStatus
                  id={story.id}
                  name={story.name}
                  count={story.approvals.length}
                  status={story.status}
                  public={story.public}
                  official={course.official}
                  updateCourses={updateCourses}
                />
              </div>
              <div>{story.author}</div>
              <div>{formatDate(story.date)}</div>
              <div>{story.author_change}</div>
              <div>{formatDate(story.change_date)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function pad_space(x) {
  if (x < 10) return " " + x;
  return x;
}

function pad(x) {
  if (x < 10) return "0" + x;
  return x;
}

function formatDate(datetime) {
  let d = new Date(datetime);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function setApproval(data, name) {
  if (
    window.confirm(
      `Did you check the story "${name}" and think it is ready to be published? If you want to give your approval click "ok".\n\nIn case you already gave an approval. "ok" will remove it.`,
    )
  ) {
    let response = await fetch(`/editor/approve/${data.story_id}`);
    return await response.json();
  }
}

function DropDownStatus(props) {
  let [loading, setLoading] = useState(0);
  let [status, set_status] = useState(props.status);
  let [count, setCount] = useState(props.count);
  const router = useRouter();

  if (props.official) return <></>;

  async function addApproval() {
    setLoading(1);
    try {
      let response = await setApproval({ story_id: props.id }, props.name);
      if (response?.count !== undefined) {
        let count = parseInt(response.count);
        setCount(count);
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

  function status_wrapper(status, public_) {
    if (props.official) return "🥇 official";
    if (public_) return "📢 published";
    if (status === "draft") return "✍️ draft";
    if (status === "finished") return "✅ finished";
    if (status === "feedback") return "🗨️ feedback";
    if (status === "published") return "📢 published";
    return status;
  }

  return (
    <div className={styles.status_field}>
      {
        <span className={styles.status_text}>
          {status_wrapper(status, props.public)}
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
        <span className={styles.approval} onClick={addApproval}>
          {"👍 " + count}
        </span>
      )}
    </div>
  );
}
