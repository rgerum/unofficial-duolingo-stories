"use client";
import styles from "../register.module.css";
import { signIn } from "@/lib/authClient";
import React from "react";
import Link from "next/link";
import Button from "@/components/layout/button";

export default function Page({}) {
  return (
    <>
      <h1 className={styles.H1}>Not Allowed</h1>
      <p className={styles.P}>
        You need to be logged in with an account that has a contributor role.
      </p>
      <p className={styles.P}>
        If you want to contribute ask us on{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
      </p>
      <p className={styles.P}>
        You might need to login and out again after you got access to the
        editor.
      </p>
      <Button primary={true} onClick={() => signIn()}>
        Log In
      </Button>
    </>
  );
}
