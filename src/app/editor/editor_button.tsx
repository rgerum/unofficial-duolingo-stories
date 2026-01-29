import styles from "./editor_button.module.css";
import React from "react";
import Link from "next/link";

export default function EditorButton({
  style,
  onClick,
  id,
  alt,
  img,
  text,
  href,
  checked,
}: {
  style?: React.CSSProperties;
  onClick?: () => void;
  id?: string;
  alt?: string;
  img?: string;
  text?: string;
  href?: string;
  checked?: boolean;
}) {
  if (checked !== undefined) {
    if (onClick === undefined) throw new Error();
    return (
      <div
        className={styles.editor_button}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        <label className={styles.switch}>
          <input type="checkbox" checked={checked} readOnly />
          <span className={styles.slider + " " + styles.round} />
        </label>
        <span>{text}</span>
      </div>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        style={style}
        id={id}
        className={styles.editor_button}
        onClick={onClick}
      >
        <div>
          <img alt={alt} src={`/editor/icons/${img}`} />
        </div>
        <span>{text}</span>
      </Link>
    );
  }
  return (
    <div
      style={style}
      id={id}
      className={styles.editor_button}
      onClick={onClick}
    >
      <div>
        <img alt={alt} src={`/editor/icons/${img}`} />
      </div>
      <span>{text}</span>
    </div>
  );
}
