import React from "react";

export default async function Page({ params }) {
  const year = parseInt((await params).year, 10);

  return (
    <div style={{ width: "800px", margin: "auto 0", padding: "24px 16px" }}>
      <h1>Yearly Report {year}</h1>
      <p>
        Statistics pages are temporarily deprecated while we migrate reporting
        to a dedicated aggregate pipeline.
      </p>
    </div>
  );
}
