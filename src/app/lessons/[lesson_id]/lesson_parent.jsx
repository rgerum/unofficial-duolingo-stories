"use client";

import React, { useEffect } from "react";
import { shuffle } from "../../../components/story/includes";
import { useRouter } from "next/navigation";
import Lesson from "../_components/lesson";

export default function LessonParent({ elements }) {
  const [shuffled, setShuffled] = React.useState(false);
  elements = elements.filter((a) => a.type !== "words");
  const [order, setWords] = React.useState(
    [...Array(elements.length)].map((_, i) => i),
  );
  useEffect(() => {
    if (!shuffled) {
      setShuffled(true);
      setWords(shuffle([...order]));
    }
  }, [order, setWords, shuffled, setShuffled]);

  const router = useRouter();
  function onFinished() {
    router.push("/lessons");
  }

  if (!shuffled) return null;
  return (
    <Lesson
      elements={order.slice(0, 3).map((i) => elements[i])}
      onFinished={onFinished}
    />
  );
}
