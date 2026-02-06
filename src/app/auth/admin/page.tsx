"use client";
import styles from "../register.module.css";
import React from "react";
import Button from "@/components/layout/button";
import { useRouter } from "next/navigation";

export default function Page({}) {
  const router = useRouter();

  return (
    <>
      <h1 className={styles.H1}>Not Allowed</h1>
      <p className={styles.P}>
        You need to be logged in with an account that has an admin role.
      </p>

      <Button primary={true} onClick={() => router.push("/auth/signin")}>
        Log In
      </Button>
    </>
  );
}
