import React from "react";
import Link from "next/link";

export default function Cast(props: {
  id: number;
  cast: Record<
    string,
    { id: string; link: string; speaker: string; name: string }
  >;
  short: string;
}) {
  let cast = [];
  let no_speaker_count = 0;
  for (let id in props.cast) {
    cast.push(props.cast[id]);
    if (!props.cast[id].speaker) no_speaker_count += 1;
  }
  return (
    <section>
      <h2 className="my-[0.83em] text-[1.5em] font-bold leading-[1.2]">Cast</h2>
      <table className="border-collapse">
        <tbody>
          {cast.map((character, i) => (
            <Character key={i} character={character} />
          ))}
        </tbody>
      </table>
      {no_speaker_count ? (
        <p className="my-[1em] leading-[1.2]">
          {no_speaker_count} characters do not have a speaker voice assigned. Go
          to the{" "}
          <Link
            className="underline underline-offset-2"
            target="_blank"
            href={"/editor/language/" + props.short}
          >
            Character-Editor
          </Link>{" "}
          to add the voices.
        </p>
      ) : (
        <p className="my-[1em] leading-[1.2]">
          To change voices or names go to the{" "}
          <Link
            className="underline underline-offset-2"
            target="_blank"
            href={"/editor/language/" + props.short}
          >
            Character-Editor
          </Link>
          .
        </p>
      )}
      <p className="my-[1em] leading-[1.2]">
        Use these links to share this story with other contributors to{" "}
        <Link
          className="underline underline-offset-2"
          href={`/story/${props.id}`}
          target={"_blank"}
        >
          test
        </Link>{" "}
        or{" "}
        <Link
          className="underline underline-offset-2"
          href={`/story/${props.id}/test`}
          target={"_blank"}
        >
          review
        </Link>{" "}
        the story. (or review{" "}
        <Link
          className="underline underline-offset-2"
          href={`/story/${props.id}/test?hide_questions=true`}
          target={"_blank"}
        >
          without the exercises
        </Link>
        ){" "}
        <Link
          className="underline underline-offset-2"
          href={`/story/${props.id}/script`}
          target={"_blank"}
        >
          Story Script
        </Link>
      </p>
    </section>
  );
}

function Character(props: {
  character: { id: string; link: string; name: string; speaker: string };
}) {
  let character = props.character;
  return (
    <tr className="align-middle">
      <td className="py-1 pr-2 text-right align-middle leading-[1.2]">
        {character.id}
      </td>
      <td className="py-1 pr-3 align-middle">
        <img
          alt={"speaker head"}
          className="h-[50px] w-[50px]"
          src={character.link}
        />
      </td>
      <td className="py-1 pr-3 align-middle leading-[1.2]">{character.name}</td>
      <td className="py-1 align-middle">
        <span className="mr-[3px] inline-block rounded bg-[var(--editor-ssml)] px-[5px] py-[2px] text-[0.8em]">
          {character.speaker}
        </span>
      </td>
    </tr>
  );
}
