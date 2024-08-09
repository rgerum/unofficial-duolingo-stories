import React from "react";
import styles from "./PlayAudio.module.css";

function PlayAudio({ onClick }) {
  const controls = {}; // React.useContext(StoryContext);
  if (onClick === undefined) return <></>;
  return (
    <img
      onClick={onClick}
      src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
      className={
        styles.loudspeaker + " " + (controls.rtl ? styles.rtl_loudspeaker : "")
      }
      alt="speaker"
    />
  );
}

export default PlayAudio;
