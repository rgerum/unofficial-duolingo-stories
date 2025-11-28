"use client";
import styles from "./profile.module.css";

import { GetIcon } from "@/components/icons";
import React from "react";
import { signIn } from "@/lib/authClient";

export default function ProviderButton({
  d,
  value,
}: {
  d: string;
  value: boolean;
}) {
  return (
    <div className={styles.account}>
      <GetIcon name={d} />
      <div>
        {d}:{" "}
        {value ? (
          <span className={styles.linkedd}>Linked</span>
        ) : (
          <span
            className={styles.link}
            onClick={() => signIn.social({ provider: d })}
          >
            Link
          </span>
        )}
      </div>
    </div>
  );
}
