import React from "react";

import StoryHeaderProgress from "@/components/StoryHeaderProgress";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <>
      <StoryHeaderProgress course="unknown" progress={0} length={10} />
      <div style={{ textAlign: "center", marginTop: "200px" }}>
        <p>Loading Story...</p>
        <Spinner />
      </div>
    </>
  );
}
