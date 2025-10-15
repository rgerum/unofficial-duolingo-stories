import React from "react";
import styles from "./cast.module.css";
import Link from "next/link";

export default function Cast(props: {
  id: number;
  cast: { id: number; link: string; speaker: string; name: string }[];
  short: string;
}) {
  let cast = [];
  let no_speaker_count = 0;
  for (let id in props.cast) {
    cast.push(props.cast[id]);
    if (!props.cast[id].speaker) no_speaker_count += 1;
  }
  return (
    <div className={styles.cast_element}>
      <h2>Cast</h2>
      <table className={styles.cast}>
        <tbody>
          {cast.map((character, i) => (
            <Character key={i} character={character} />
          ))}
        </tbody>
      </table>
      {no_speaker_count ? (
        <p>
          {no_speaker_count} characters do not have a speaker voice assigned. Go
          to the{" "}
          <a target="_blank" href={"/editor/language/" + props.short}>
            Character-Editor
          </a>{" "}
          to add the voices.
        </p>
      ) : (
        <p>
          To change voices or names go to the{" "}
          <a target="_blank" href={"/editor/language/" + props.short}>
            Character-Editor
          </a>
          .
        </p>
      )}
      <p>
        Use these links to share this story with other contributors to{" "}
        <Link href={`/story/${props.id}`}>test</Link> or{" "}
        <Link href={`/story/${props.id}/test`}>review</Link> the story. (or
        review{" "}
        <Link href={`/story/${props.id}/test?hide_questions=true`}>
          without the exercises
        </Link>
        ) <Link href={`/story/${props.id}/script`}>Story Script</Link>
      </p>
    </div>
  );
}

function Character(props: {
  character: { id: number; link: string; name: string; speaker: string };
}) {
  let character = props.character;
  return (
    <tr className={styles.character}>
      <td style={{ textAlign: "right" }}>{character.id}</td>
      <td>
        <img
          alt={"speaker head"}
          className={styles.head}
          src={character.link}
        />
      </td>
      <td>{character.name}</td>
      <td>
        <span className={styles.ssml_speaker}>{character.speaker}</span>
      </td>
    </tr>
  );
}
