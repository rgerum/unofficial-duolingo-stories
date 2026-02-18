import React from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const year = parseInt((await params).year, 10);
  const month = parseInt((await params).month, 10);
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
  const monthLabel = months[month] ?? `${month}`;

  return (
    <div style={{ width: "800px", margin: "auto 0", padding: "24px 16px" }}>
      <h1>
        Report {monthLabel} {year}
      </h1>
      <p>
        Statistics pages are temporarily deprecated while we migrate reporting
        to a dedicated aggregate pipeline.
      </p>
    </div>
  );
}
