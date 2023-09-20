"use client";
import styles from "../register.module.css";
import { signIn } from "next-auth/react";
import React from "react";

export default function Page({}) {
  return (
    <>
      <h2>Not Allowed</h2>
      <p>You need to be logged in with an account that has an admin role.</p>

      <button className={styles.button} onClick={() => signIn()}>
        Log In
      </button>
    </>
  );
}
