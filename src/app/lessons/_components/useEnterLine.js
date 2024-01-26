import React, { useState } from "react";

function useAddList(words, full) {
  let [listedWords, setListedWords] = useState(
    full ? [...Array(words.length)].map((x, i) => i) : [],
  );
  function add(i) {
    if (i === undefined) return;
    setListedWords([...listedWords, i]);
  }
  function remove(i) {
    setListedWords(listedWords.filter((v, index) => index !== i));
    return listedWords[i];
  }
  return [
    listedWords.map((v) => {
      return {
        word: words[v],
      };
    }),
    add,
    remove,
  ];
}

function useHideList(words, full) {
  let [active, setActive] = useState([...Array(words.length)].map(() => full));
  function add(i) {
    if (i === undefined) return;
    setActive(active.map((v, index) => (index === i ? true : v)));
  }
  function remove(i) {
    if (!active[i]) return undefined;
    setActive(active.map((v, index) => (index === i ? false : v)));
    return i;
  }

  const all_words = [];
  for (let i = 0; i < words.length; i++) {
    all_words.push({
      word: words[i],
      status: active[i] ? "idle" : "hidden",
    });
  }
  return [all_words, add, remove];
}

export default function useEnterLine(words) {
  let [params1, words1_add, words1_remove] = useAddList(words, false);
  let [params2, words2_add, words2_remove] = useHideList(words, true);

  let click1 = React.useCallback(
    (index) => {
      words2_add(words1_remove(index));
    },
    [words1_remove, words2_add],
  );
  let click2 = React.useCallback(
    (index) => {
      words1_add(words2_remove(index));
    },
    [words1_add, words2_remove],
  );
  /*
  let key_event_handler = React.useCallback(
    (e) => {
      let value = parseInt(e.key) - 1;
      if (value < words2.length) click2(value);
    },
    [words2],
  );
  React.useEffect(() => {
    window.addEventListener("keypress", key_event_handler);
    return () => window.removeEventListener("keypress", key_event_handler);
  }, [key_event_handler]);
*/
  for (let i = 0; i < params1.length; i++) {
    params1[i].onClick = () => click1(i);
  }
  for (let i = 0; i < params2.length; i++) {
    params2[i].onClick = () => click2(i);
  }
  return [params1, params2];
}
