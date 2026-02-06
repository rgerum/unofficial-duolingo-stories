import React from "react";
import styles from "../../../register.module.css";
import Link from "next/link";
import { activate } from "./activate";

interface PageProps {
  params: Promise<{ name: string; hash: string }>;
}

export default async function Page({ params }: PageProps) {
  const activated = await activate(await params);

  return (
    <>
      <h1 className={styles.H1}>Activate account</h1>
      {typeof activated === "object" && "status" in activated ? (
        <p className={styles.P} id="status">
          activating account...
        </p>
      ) : activated === "done" ? (
        <>
          <p className={styles.P} id="status">
            Activation successful.
          </p>
          <p className={styles.P} id="login_form">
            {/* Use of absolute link because relative links would only be relative to carex.uber.space */}
            You can now{" "}
            <Link href="/auth/signin" data-cy="log-in">
              log in
            </Link>
            .
          </p>
        </>
      ) : (
        <p className={styles.P} id="status">
          Activation not successful.
        </p>
      )}
    </>
  );
}
