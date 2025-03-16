"use client";
import styles from "./learn.module.css";
import { signIn } from "next-auth/react";
import styles2 from "../../auth/register.module.css";
import Link from "next/link";
import React from "react";

export default function Page() {
  return (
    <div className={styles.container}>
      <div>
        <h1>Welcome to Duostories</h1>
        <img src={"icon192.png"} alt="icon" />
        <p>Log in to proceed</p>
        <button onClick={() => signIn()} className={styles2.button}>
          Sign in
        </button>
        <Link href="/auth/register" className={styles2.button}>
          Register
        </Link>
        <hr />
        <Link href={"/"} className={styles.button_alt + " " + styles2.button}>
          Anonymous
        </Link>
      </div>
    </div>
  );
}
