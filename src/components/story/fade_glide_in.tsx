import styles from "./fade_glide_in.module.css";
import React from "react";

interface FadeGlideInProps {
  children: React.ReactNode;
  hidden2?: string;
  onClick?: () => void;
  element?: { editor?: { block_start_no?: number } };
}

export default function FadeGlideIn({ children, hidden2, onClick, element }: FadeGlideInProps) {
  return (
    <div
      className={styles.fadeGlideIn + " " + (hidden2 || "")}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
    >
      {children}
    </div>
  );
}
