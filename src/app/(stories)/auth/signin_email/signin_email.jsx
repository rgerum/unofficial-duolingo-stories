"use client";
import { signIn } from "next-auth/react";
import styles from "../register.module.css";
import React from "react";
import { useInput } from "lib/hooks";
import { useSearchParams } from "next/navigation";
import Button from "../../../../components/layout/button";

export default function SignInEmail({}) {
  let [emailInput, emailInputSetValue] = useInput("");

  async function register_button2() {
    await signIn("email", { email: emailInput });
  }

  const handleKeypressSignup2 = (e) => {
    // listens for enter key
    if (e.keyCode === 13) {
      register_button2();
    }
  };

  let error_codes = {
    OAuthSignin: "Try signing in with a different account.",
    OAuthCallback: "Try signing in with a different account.",
    OAuthCreateAccount: "Try signing in with a different account.",
    EmailCreateAccount: "Try signing in with a different account.",
    Callback: "Try signing in with a different account.",
    OAuthAccountNotLinked:
      "To confirm your identity, sign in with the same account you used originally.",
    EmailSignin: "The e-mail could not be sent.",
    CredentialsSignin:
      "Sign in failed. Check the details you provided are correct.",
    SessionRequired: "Please sign in to access this page.",
    Default: "Unable to sign in.",
  };
  let query = useSearchParams();
  let error = error_codes[query.get("error")];

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
      {error ? <span className={styles.error}>{error}</span> : <></>}
      <form className={styles.Form} action={register_button2}>
        <input
          data-cy="email"
          value={emailInput}
          onChange={emailInputSetValue}
          onKeyDown={handleKeypressSignup2}
          type="email"
          placeholder="Email"
          name="email"
        />
        <Button data-cy="submit" variant="blue" onClick={register_button2}>
          {"Log in with email"}
        </Button>
      </form>
    </>
  );
}
