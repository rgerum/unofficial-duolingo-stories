import React, { useEffect } from "react";

export default function useShuffle(array) {
  const [shuffled, setShuffled] = React.useState(false);
  const [words, setWords] = React.useState(array);
  useEffect(() => {
    if (!shuffled) {
      setShuffled(true);
      setWords(shuffle([...words]));
    }
  }, [words, setWords, shuffled, setShuffled]);

  return words;
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}
