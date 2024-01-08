"use client";
import styles from "./profile.module.css";
import { signIn } from "next-auth/react";
import { GetIcon } from "components/icons";
import React from "react";

export default function ProviderButton({ d, value }) {
  return (
    <div className={styles.account}>
      <GetIcon name={d} />
      <div>
        {d}:{" "}
        {value ? (
          <span className={styles.linkedd}>Linked</span>
        ) : (
          <span className={styles.link} onClick={() => signIn(d)}>
            Link
          </span>
        )}
      </div>
    </div>
  );
}
