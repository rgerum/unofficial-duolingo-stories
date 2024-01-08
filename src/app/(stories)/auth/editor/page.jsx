"use client";
import styles from "../register.module.css";
import { signIn } from "next-auth/react";
import React from "react";
import Link from "next/link";

export default function Page({}) {
  return (
    <>
      <h2>Not Allowed</h2>
      <p>
        You need to be logged in with an account that has a contributor role.
      </p>
      <p>
        If you want to contribute ask us on{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
      </p>
      <p>
        You might need to login and out again after you got access to the
        editor.
      </p>
      <button className={styles.button} onClick={() => signIn()}>
        Log In
      </button>
    </>
  );
}
