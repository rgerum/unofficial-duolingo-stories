"use client";
import React from "react";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import posthog from "posthog-js";

import styles from "../register.module.css";
import { GetIcon } from "@/components/icons";
import Button from "@/components/layout/button";
import Input from "@/components/layout/Input";
import { SpinnerBlue } from "@/components/layout/spinner";
import { ProviderProps } from "@/app/auth/signin/page";

export function LoginOptions(props: {
  providers: ProviderProps[];
  signin_action: (
    state: { error: string | null },
    data: FormData,
  ) => Promise<{ error: string | null }>;
}) {
  const { providers, signin_action } = props;

  // Wrap signin_action to identify user on successful login
  const wrappedSigninAction = async (
    state: { error: string | null },
    formData: FormData,
  ): Promise<{ error: string | null }> => {
    const username = formData.get("username") as string;
    const result = await signin_action(state, formData);

    // If login was successful (no error), identify the user
    if (!result.error && username) {
      posthog.identify(username, {
        username: username,
      });
      posthog.capture("user_signed_in", {
        auth_method: "credentials",
        username: username,
      });
    }

    return result;
  };

  const [state, formAction, isPending] = React.useActionState(
    wrappedSigninAction,
    {
      error: null,
    },
  );

  const [usernameInput, usernameInputSetValue] = useInput("");
  const [passwordInput, passwordInputSetValue] = useInput("");

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
      {state.error && <span className={styles.error}>{state.error}</span>}
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
        {"Don't have an account? "}
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
        {providers.map((provider) => (
          <button
            key={provider.id}
            className={styles.button2}
            onClick={provider.action}
          >
            <GetIcon name={provider.id} />
            <span>{provider.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
