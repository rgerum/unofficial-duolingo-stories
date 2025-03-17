import React from "react";
import Link from "next/link";

export default function get_localisation_func(data: Record<string, string>) {
  function apply(
    tag: string,
    replacements?: Record<string, string>,
    links?: string[],
  ) {
    let text = data[tag];
    if (!text) return undefined;
    if (replacements) text = replaceTags(text, replacements);
    if (tag.startsWith("meta")) return text;
    if (links && replacements)
      return replaceLinks(replaceTags(text, replacements), links);
    return insetWithNewlines(text);
  }
  return apply;
}

function insetWithNewlines(text: string) {
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

export function replaceLinks(text: string, links: string[]) {
  return (
    <>
      {text.split(/[{}]/).map((t, i) => (
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

export function replaceTags(text: string, tags: Record<string, string>) {
  for (let tag in tags) {
    text = text.replaceAll(tag, tags[tag]);
  }
  return text;
}
