import React from "react";

import { get_stats, StatsCourseProps, StatsLanguageProps } from "./db_query";
import StatsElement from "./stats_element";
import StatsElement2 from "./stats_element2";

function DataGroup({
  title,
  data,
  data_old,
  key_name,
}: {
  title: string;
  data: StatsData;
  data_old: StatsData;
  key_name:
    | "stories_published"
    | "stories_read"
    | "active_users"
    | "active_stories";
}) {
  const courses: Record<number, StatsCourseProps> = {};
  for (const c of data["courses"]) {
    courses[c.id] = c;
  }
  const languages: Record<number, StatsLanguageProps> = {};
  for (const l of data["languages"]) {
    languages[l.id] = l;
  }
  const story_ids: number[] = [];
  let total_count = 0;
  let total_count_old = 0;
  for (const l of data[key_name]) {
    story_ids.push(l.course_id);
    total_count += l.count;
  }
  const old_stories: Record<number, { count: number; course_id: number }> = {};
  for (const l of data_old[key_name]) {
    old_stories[l.course_id] = l;
    total_count_old += l.count;
    if (!story_ids.includes(l.course_id)) {
      data[key_name].push({ course_id: l.course_id, count: 0 });
    }
  }
  return (
    <>
      <h2>
        {title}
        {key_name == "active_users"
          ? data["active_users_count"]
          : total_count}{" "}
        <span style={{ fontSize: "0.8em" }}>
          {key_name == "active_users"
            ? data_old["active_users_count"]
            : total_count_old}
        </span>
      </h2>
      <div
        style={{
          margin: "0 16px",
          overflowX: "scroll",
          display: "flex",
          width: "830px",
        }}
      >
        {data[key_name].map((d, i) => (
          <StatsElement
            key={i}
            lang1={languages[courses[d.course_id].learning_language]}
            lang2={languages[courses[d.course_id].from_language]}
            count={d.count}
            count_old={old_stories[d.course_id]?.count}
            max_count={Math.max(
              data[key_name][0]?.count || 0,
              data_old[key_name][0]?.count || 0,
            )}
          />
        ))}
      </div>
    </>
  );
}

type StatsData = Awaited<ReturnType<typeof get_stats>>;

function ref_by_course(
  data: StatsData,
  data_old: StatsData,
  key: "stories_published" | "stories_read" | "active_users" | "active_stories",
) {
  const refs: Record<
    number,
    {
      count: number;
      count_old: number;
      rank?: number;
      rank_old?: number;
      max_count: number;
    }
  > = {};
  let index = 1;
  const max_count = Math.max(data[key][0]?.count, data_old[key][0]?.count);
  for (const c of data[key]) {
    refs[c.course_id] = {
      count: c.count,
      count_old: 0,
      rank: index,
      max_count: max_count,
    };
    index += 1;
  }
  let index_old = 1;
  for (const c of data_old[key]) {
    if (!refs[c.course_id])
      refs[c.course_id] = {
        count: 0,
        max_count: max_count,
        count_old: c.count,
      };
    refs[c.course_id].count_old = c.count;
    refs[c.course_id].rank_old = index_old;
    index_old += 1;
  }
  return refs;
}

export default async function Page({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  let year = parseInt((await params).year);
  let month = parseInt((await params).month);
  const data = await get_stats(year, month);
  data.year = year;
  data.month = month;
  const data_old = await get_stats(
    month === 1 ? year - 1 : year,
    month === 1 ? 12 : month - 1,
  );
  data_old.year = month === 1 ? year - 1 : year;
  data_old.month = month === 1 ? 12 : month - 1;

  const courses: Record<number, StatsCourseProps> = {};
  for (const c of data["courses"]) {
    courses[c.id] = c;
  }
  const languages: Record<number, StatsLanguageProps> = {};
  for (const l of data["languages"]) {
    languages[l.id] = l;
  }
  const months: Record<number, string> = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
  };
  const stories_published = ref_by_course(data, data_old, "stories_published");
  const stories_read = ref_by_course(data, data_old, "stories_read");
  const active_users = ref_by_course(data, data_old, "active_users");
  const active_stories = ref_by_course(data, data_old, "active_stories");
  const stats_course = [];
  for (const c of data["courses"]) {
    if (c.public)
      stats_course.push({
        id: c.id,
        learning_language: languages[c.learning_language],
        from_language: languages[c.from_language],
        stories_published: stories_published[c.id],
        stories_read: stories_read[c.id],
        active_users: active_users[c.id],
        active_stories: active_stories[c.id],
      });
  }

  return (
    <>
      <div style={{ width: "800px", margin: "auto 0" }}>
        <h1>
          Report {months[month]} {year}
        </h1>
        <DataGroup
          title={"Stories Published"}
          data={data}
          data_old={data_old}
          key_name={"stories_published"}
        />
        <DataGroup
          title={"Stories Read"}
          data={data}
          data_old={data_old}
          key_name={"stories_read"}
        />
        <DataGroup
          title={"Active Users"}
          data={data}
          data_old={data_old}
          key_name={"active_users"}
        />
        <DataGroup
          title={"Active Stories"}
          data={data}
          data_old={data_old}
          key_name={"active_stories"}
        />
        <h2>Course Statistics</h2>
        {stats_course.map((c, i) => (
          <StatsElement2 key={i} course={c} />
        ))}
      </div>
    </>
  );
}
