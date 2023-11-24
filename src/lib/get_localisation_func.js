import React from "react";
import Link from "next/link";

export default function get_localisation_func(data) {
  function apply(tag, replacements, links) {
    let text = data[tag];
    if (!text) return undefined;
    if (replacements) text = replaceTags(text, replacements);
    if (links) return replaceLinks(replaceTags(text, replacements), links);
    return insetWithNewlines(text);
  }
  return apply;
}

function insetWithNewlines(text) {
  let parts = text.split("\n");
  let last = parts[parts.length - 1];
  return (
    <>
      {parts.slice(0, parts.length - 1).map((t, i) => (
        <React.Fragment key={i}>
          {t}
          <br />
        </React.Fragment>
      ))}
      {last}
    </>
  );
}

export function replaceLinks(text, links) {
  if (!text) return undefined;
  return (
    <>
      {text.split(/{|}/).map((t, i) => (
        <React.Fragment key={i}>
          {i % 2 === 0 ? (
            insetWithNewlines(t)
          ) : (
            <Link href={links[(i - 1) / 2]}>{t}</Link>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export function replaceTags(text, tags) {
  if (!text) return undefined;
  for (let tag in tags) {
    text = text.replaceAll(tag, tags[tag]);
  }
  return text;
}
