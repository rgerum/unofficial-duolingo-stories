"use client";
import styles from "./profile.module.css";
import { signIn } from "next-auth/react";

export default function ProviderButton({ d, value }) {
  return (
    <div className={styles.account}>
      <img
        loading="lazy"
        id="provider-logo"
        src={`https://authjs.dev/img/providers/${d}.svg`}
        alt=""
        width="24"
        height="24"
      />
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
