"use client";
import React from "react";
import styles from "../register.module.css";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import Button from "@/components/layout/button";
import Input from "@/components/layout/Input";
import { authClient } from "@/lib/authClient";
import { z } from "zod";

export default function ResetPassword() {
  const [state, setState] = React.useState(0);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [emailInput, emailInputSetValue] = useInput("");

  async function register_button() {
    const emailValidation = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!z.email().safeParse(emailInput).success) {
      let msg = "Not a valid email, please try again.";
      setError(msg);
      setState(-1);
      return;
    }

    setState(1);
    try {
      const { data, error } = await authClient.requestPasswordReset({
        email: emailInput, // required
        redirectTo: "/auth/reset_pw/reset",
      });
      if (error) {
        setState(-1);
        setError("An Error occurred." + error.message);
      } else {
        setState(1);
      }
    } catch (e) {
      setState(-1);
      setError("An Error occurred." + e);
    }
    setMessage(
      "If the account exists an email was sent out with a link to reset the password.",
    );
    setState(2);
  }

  return (
    <>
      <h1 className={styles.H1}>Reset Password</h1>
      <p className={styles.P}>
        You forgot your password? We can send you a link to reset it.
      </p>
      {state === -1 && <span className={styles.error}>{error}</span>}
      {state === 2 ? (
        <span className={styles.message} data-cy="message-confirm">
          {message}
        </span>
      ) : (
        <form action={register_button} className={styles.Form}>
          <Input
            data-cy="email"
            value={emailInput}
            onChange={emailInputSetValue}
            type="email"
            name="email"
            placeholder="Email"
          />
          <Button primary={true} data-cy="submit" type="submit" variant="blue">
            {state !== 1 ? "Send Link" : "..."}
          </Button>
        </form>
      )}
      <p className={styles.P}>
        Already have an account?{" "}
        <Link className={styles.link} href="/auth/signin">
          LOG IN
        </Link>
      </p>
    </>
  );
}
