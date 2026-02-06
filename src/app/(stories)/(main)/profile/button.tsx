"use client";
import styles from "./profile.module.css";
import { GetIcon } from "@/components/icons";
import React from "react";
import { authClient } from "@/lib/auth-client";

export default function ProviderButton({
  d,
  value,
}: {
  d: string;
  value: boolean;
}) {
  const handleLink = async () => {
    const { data, error } = await authClient.linkSocial({
      provider: d,
      callbackURL: window.location.href,
    });

    if (error) {
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className={styles.account}>
      <GetIcon name={d} />
      <div>
        {d}:{" "}
        {value ? (
          <span className={styles.linkedd}>Linked</span>
        ) : (
          <span className={styles.link} onClick={handleLink}>
            Link
          </span>
        )}
      </div>
    </div>
  );
}
