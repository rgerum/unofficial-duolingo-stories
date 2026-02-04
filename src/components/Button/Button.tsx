import styles from "./Button.module.css";
import React from "react";

export default function Button({
  children,
  disabled,
  primary = false,
  ...delegated
}: {
  children: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
  [key: string]: any;
}) {
  const className = primary
    ? `${styles.ButtonStyled} ${styles.ButtonBlueStyled}`
    : styles.ButtonStyled;

  if (disabled) {
    return (
      <button
        className={`${styles.ButtonStyled} ${styles.ButtonDisabled}`}
        disabled
        {...delegated}
      >
        <span className={styles.Wrapper}>{children}</span>
      </button>
    );
  }

  return (
    <button className={className} {...delegated}>
      <span className={styles.Wrapper}>{children}</span>
    </button>
  );
}
