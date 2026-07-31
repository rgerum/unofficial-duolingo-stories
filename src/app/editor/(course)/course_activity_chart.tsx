"use client";

import { api } from "@convex/_generated/api";
import { Activity, BookOpen, Users } from "lucide-react";
import { useQuery } from "convex/react";
import { useId, useState } from "react";

const PERIODS = [30, 90, 180] as const;
const WIDTH = 720;
const HEIGHT = 116;
const PAD_X = 8;
const PAD_Y = 10;

type Point = {
  date: string;
  storyReads: number;
  newReaders: number;
  totalReaders: number;
};

export default function CourseActivityChart({
  courseIdentifier,
}: {
  courseIdentifier: string;
}) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(90);
  const data = useQuery(api.courseReadStats.getForEditor, {
    courseIdentifier,
    days,
  });

  if (data === undefined) {
    return (
      <div className="my-6 h-[350px] animate-pulse rounded-2xl bg-black/5" />
    );
  }
  if (!data) return null;

  const readsInPeriod = data.points.reduce(
    (total, point) => total + point.storyReads,
    0,
  );
  const readersInPeriod = data.points.reduce(
    (total, point) => total + point.newReaders,
    0,
  );

  return (
    <section className="my-6 overflow-hidden rounded-2xl border-2 border-[#9cc7de] bg-[#f4fbff] dark:border-[#31576d] dark:bg-[#172a35]">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#cce2ed] px-5 py-4 dark:border-[#294858]">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8f1ff] text-[#1680b5] dark:bg-[#244b60] dark:text-[#75c9f2]">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[calc(19/16*1rem)] font-bold">
              Course activity
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-color-dim)]">
              Completions from all visitors; learner counts include signed-in
              accounts.
            </p>
          </div>
        </div>
        <div
          className="flex rounded-xl bg-[#dceef7] p-1 dark:bg-[#203f50]"
          aria-label="Chart period"
          role="group"
        >
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                days === period
                  ? "bg-white text-[#126f9c] shadow-sm dark:bg-[#315d72] dark:text-white"
                  : "text-[var(--text-color-dim)] hover:text-[var(--text-color)]"
              }`}
              aria-pressed={days === period}
              onClick={() => setDays(period)}
            >
              {period}d
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-5 p-5 min-[760px]:grid-cols-2">
        <MetricChart
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          label="Stories read"
          value={readsInPeriod}
          detail={`${data.totalStoryReads.toLocaleString()} all time`}
          points={data.points}
          valueForPoint={(point) => point.storyReads}
          color="#1680b5"
          kind="bars"
        />
        <MetricChart
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          label="Signed-in learners"
          value={data.totalReaders}
          detail={`+${readersInPeriod.toLocaleString()} in this period`}
          points={data.points}
          valueForPoint={(point) => point.totalReaders}
          color="#58a700"
          kind="line"
        />
      </div>
    </section>
  );
}

function MetricChart({
  icon,
  label,
  value,
  detail,
  points,
  valueForPoint,
  color,
  kind,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
  points: Point[];
  valueForPoint: (point: Point) => number;
  color: string;
  kind: "bars" | "line";
}) {
  const gradientId = useId().replaceAll(":", "");
  const values = points.map(valueForPoint);
  const max = Math.max(1, ...values);
  const chartWidth = WIDTH - PAD_X * 2;
  const chartHeight = HEIGHT - PAD_Y * 2;
  const coordinates = values.map((value, index) => ({
    x: PAD_X + (index / Math.max(1, values.length - 1)) * chartWidth,
    y: PAD_Y + chartHeight - (value / max) * chartHeight,
  }));
  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${PAD_X},${HEIGHT - PAD_Y} ${line} ${WIDTH - PAD_X},${HEIGHT - PAD_Y}`;
  const barWidth = Math.max(1.5, chartWidth / Math.max(1, values.length) - 1);

  return (
    <article className="rounded-xl bg-white/75 p-4 shadow-[0_1px_0_rgba(20,80,110,0.08)] dark:bg-black/10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-color-dim)]">
            <span style={{ color }}>{icon}</span>
            {label}
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums">
            {value.toLocaleString()}
          </p>
        </div>
        <p className="pb-1 text-right text-xs text-[var(--text-color-dim)]">
          {detail}
        </p>
      </div>
      <svg
        className="mt-3 h-[116px] w-full overflow-visible"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${label} over the selected period`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.3" />
            <stop offset="1" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={`M ${PAD_X} ${HEIGHT - PAD_Y} H ${WIDTH - PAD_X}`}
          stroke="currentColor"
          className="text-black/10 dark:text-white/10"
        />
        {kind === "bars" ? (
          coordinates.map(({ x, y }, index) => (
            <rect
              key={points[index]?.date}
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={HEIGHT - PAD_Y - y}
              rx={Math.min(2, barWidth / 2)}
              fill={color}
              opacity="0.78"
            >
              <title>{`${points[index]?.date}: ${values[index]} stories read`}</title>
            </rect>
          ))
        ) : (
          <>
            <polygon points={area} fill={`url(#${gradientId})`} />
            <polyline
              points={line}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--text-color-dim)]">
        <span>{formatDate(points[0]?.date)}</span>
        <span>{formatDate(points.at(-1)?.date)}</span>
      </div>
    </article>
  );
}

function formatDate(date?: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
