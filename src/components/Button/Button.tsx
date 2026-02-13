import styles from "./Button.module.css";
import React from "react";

export default function Button({
  children,
  disabled,
  primary = false,
  variant: _variant,
  ...delegated
}: {
  children: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
  variant?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
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
