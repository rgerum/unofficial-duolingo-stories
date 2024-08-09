"use client";
import React from "react";
import styled from "styled-components";

export default function Progressbar({ progress, length }) {
  return (
    <Progress
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin="0"
      aria-valuemax={length}
    >
      <ProgressInside style={{ "--width": (progress / length) * 100 + "%" }}>
        <ProgressHighlight />
      </ProgressInside>
    </Progress>
  );
}

const Progress = styled.div`
  background: var(--progress-back);

  --height: 16px;
  border-radius: calc(var(--height) / 2);
  height: var(--height);
  overflow: hidden;
`;

const ProgressInside = styled.div`
  position: relative;
  width: var(--width);
  height: var(--height);
  background: var(--progress-inside);
  border-radius: calc(var(--height) / 2);
  transition: width 0.2s;
`;

const ProgressHighlight = styled.div`
  position: absolute;
  top: 25%;
  left: calc(var(--height) / 2);
  right: calc(var(--height) / 2);
  height: 30%;

  background: var(--progress-highlight);
  border-radius: inherit;
  opacity: 0.2;
`;
