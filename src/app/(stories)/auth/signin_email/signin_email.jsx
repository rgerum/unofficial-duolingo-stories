"use client";
import { signIn } from "next-auth/react";
import styles from "../register.module.css";
import React from "react";
import { useInput } from "lib/hooks";
import { useSearchParams } from "next/navigation";
import Button from "../../../../components/layout/button";
import Input from "../../../../components/layout/Input";
import { error_codes } from "../error_codes";

export default function SignInEmail({}) {
  const [emailInput, emailInputSetValue] = useInput("");

  async function signin_email() {
    await signIn("email", { email: emailInput });
  }

  const query = useSearchParams();
  const error = error_codes[query.get("error")];

  return (
    <>
      <h1 className={styles.H1}>Log in</h1>
      <p className={styles.P}>
        Attention, you cannot login with your Duolingo account.
      </p>
      <p className={styles.P}>
        You have to register for the unofficial stories separately, as they are
        an independent project.
      </p>
      {error && <span className={styles.error}>{error}</span>}
      <form className={styles.Form} action={signin_email}>
        <Input
          data-cy="email"
          value={emailInput}
          onChange={emailInputSetValue}
          type="email"
          placeholder="Email"
          name="email"
        />
        <Button primary={true} data-cy="submit" variant="blue">
          {"Log in with email"}
        </Button>
      </form>
    </>
  );
}
