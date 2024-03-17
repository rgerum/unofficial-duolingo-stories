"use client";
import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { useInput } from "lib/hooks";

import styles from "../register.module.css";
import { useSearchParams } from "next/navigation";
import { GetIcon } from "components/icons";
import Button from "../../../../components/layout/button";
import Input from "../../../../components/layout/Input";

export function LoginOptions({ providers }) {
  async function register_button() {
    await signIn("credentials", {
      name: usernameInput,
      password: passwordInput,
    });
  }

  let [usernameInput, usernameInputSetValue] = useInput("");
  let [passwordInput, passwordInputSetValue] = useInput("");
  //let [emailInput, emailInputSetValue] = useInput("");

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

  const handleKeypressSignup = (e) => {
    // listens for enter key
    if (e.keyCode === 13) {
      register_button();
    }
  };

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
      <form className={styles.Form} action={register_button}>
        <Input
          data-cy="username"
          value={usernameInput}
          onChange={usernameInputSetValue}
          type="text"
          name="username"
          placeholder="Username"
        />
        <Input
          data-cy="password"
          value={passwordInput}
          onChange={passwordInputSetValue}
          onKeyDown={handleKeypressSignup}
          type="password"
          name="password"
          placeholder="Password"
        />
        <Button data-cy="submit" onClick={register_button} primary>
          {"Log in"}
        </Button>
      </form>
      <p className={styles.P}>
        Don't have an account?{" "}
        <Link
          href="/auth/register"
          data-cy="register-button"
          className={styles.link}
        >
          Sign Up
        </Link>
        <br />
        Forgot Password?{" "}
        <Link
          href="/auth/reset_pw"
          data-cy="reset-button"
          className={styles.link}
        >
          Reset
        </Link>
      </p>
      <hr />
      {/*<input data-cy="email" value={emailInput} onChange={emailInputSetValue} onKeyDown={handleKeypressSignup2} type="email" placeholder="Email" name="email"/>
                        <button data-cy="submit"  className={styles.button}
                                onClick={register_button2}>{ "Log in with email" }</button>

                        <hr/>*/}
      <div className={styles.providers}>
        {Object.values(providers).map((provider) =>
          provider.id !== "email" && provider.id !== "credentials" ? (
            <button
              key={provider.id}
              className={styles.button2}
              onClick={() => signIn(provider.id)}
            >
              <GetIcon name={provider.id} />
              <span>{provider.name}</span>
            </button>
          ) : (
            <span key={provider.id}></span>
          ),
        )}
      </div>
    </>
  );
}
