"use client";
import styles from "../register.module.css";
import { signIn } from "next-auth/react";
import React from "react";
import Button from "../../../../components/layout/button";

export default function Page({}) {
  return (
    <>
      <h1 className={styles.H1}>Not Allowed</h1>
      <p className={styles.P}>
        You need to be logged in with an account that has an admin role.
      </p>

      <Button variant="blue" onClick={() => signIn()}>
        Log In
      </Button>
    </>
  );
}
