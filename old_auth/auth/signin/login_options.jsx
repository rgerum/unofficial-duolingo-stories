"use client";
import React from "react";
import Link from "next/link";
import { useInput } from "@/lib/hooks";

import styles from "../register.module.css";
import { useSearchParams } from "next/navigation";
import { GetIcon } from "@/components/icons";
import Button from "@/components/layout/button";
import Input from "@/components/layout/Input";
import { error_codes } from "../error_codes";
import signIn from "@/signin_cred";
import { Spinner, SpinnerBlue } from "@/components/layout/spinner";

export function LoginOptions({ providers }) {
  const externalProviders = Object.values(providers).filter(
    (provider) => provider.id !== "email" && provider.id !== "credentials",
  );

  const [state, formAction, isPending] = React.useActionState(
    async () => {
      try {
        const result = await signIn("credentials", {
          name: usernameInput,
          password: passwordInput,
        });
        console.log(result);
        return {};
      } catch (error) {
        return { error: error };
      }
    },
    { error: null },
  );

  const [usernameInput, usernameInputSetValue] = useInput("");
  const [passwordInput, passwordInputSetValue] = useInput("");

  const query = useSearchParams();
  const error = error_codes[query.get("error")];
  console.log(state);
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
      {state.error && <span className={styles.error}>{state.error.msg}</span>}
      <form className={styles.Form} action={formAction}>
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
          type="password"
          name="password"
          placeholder="Password"
        />
        <Button data-cy="submit" primary>
          {isPending ? <SpinnerBlue /> : "Log in"}
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
      <div className={styles.providers}>
        {externalProviders.map((provider) => (
          <button
            key={provider.id}
            className={styles.button2}
            onClick={() => signIn(provider.id)}
          >
            <GetIcon name={provider.id} />
            <span>{provider.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
