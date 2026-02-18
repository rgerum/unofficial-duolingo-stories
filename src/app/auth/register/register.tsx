"use client";
import Head from "next/head";
import React from "react";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

export default function Register() {
  const headingClass = "m-0 text-[calc(24/16*1rem)]";
  const paragraphClass = "m-0";
  const linkClass =
    "m-0 w-auto cursor-pointer border-none bg-transparent text-[1em] font-bold text-[var(--link-blue)] no-underline";
  const alertErrorClass =
    "block w-full rounded-[10px] bg-[var(--error-red)] p-[10px] text-white";
  const alertMessageClass =
    "block w-full rounded-[10px] bg-[var(--button-blue-background)] p-[10px] text-white";

  const [state, setState] = React.useState(0);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [usernameInput, usernameInputSetValue] = useInput("");
  const [passwordInput, passwordInputSetValue] = useInput("");
  const [emailInput, emailInputSetValue] = useInput("");

  function validateInputs() {
    const emailValidation = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w+)+$/;
    const usernameValidation = /^[a-zA-Z0-9_-]{3,20}$/; // Alphanumeric, 3-20 characters

    if (!usernameValidation.test(usernameInput)) {
      setError(
        "Username must be 3-20 characters long and can only contain letters, numbers, underscores, and dashes.",
      );
      return false;
    }

    if (!emailValidation.test(emailInput)) {
      setError("Not a valid email, please try again.");
      return false;
    }

    if (passwordInput.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    return true;
  }

  async function register_button(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent form submission from refreshing the page

    if (!validateInputs()) {
      setState(-1);
      return;
    }

    setState(1);
    const { error: signUpError } = await authClient.signUp.email({
      name: usernameInput,
      email: emailInput,
      password: passwordInput,
      username: usernameInput,
      displayUsername: usernameInput,
    });

    if (signUpError) {
      setError(signUpError?.message || "Something went wrong.");
      setState(-1);
    } else {
      setState(2);
      setMessage(
        "Your account has been registered. An e-mail with a verification link has been sent to you. Please click on the link in the e-mail to proceed. You may need to look into your spam folder.",
      );
      posthog.capture("user_signed_up", {
        username: usernameInput,
        email: emailInput,
      });
    }
  }

  return (
    <>
      <Head>
        <title>Duostories Login</title>
        <link rel="canonical" href={`https://duostories.org/login`} />
      </Head>

      <h1 className={headingClass}>Sign up</h1>
      <p className={paragraphClass}>
        If you register you can keep track of the stories you have already
        finished.
      </p>
      <p className={paragraphClass}>
        Registration is optional, stories can be accessed even without login.
      </p>
      {state === -1 && <span className={alertErrorClass}>{error}</span>}
      {state === 2 && (
        <span className={alertMessageClass} data-cy="message-confirm">
          {message}
        </span>
      )}
      {state !== 2 && (
        <form onSubmit={register_button} className="flex flex-col gap-2">
          <Input
            data-cy="username"
            value={usernameInput}
            onChange={usernameInputSetValue}
            type="text"
            placeholder="Username"
            required
            pattern="^[A-Za-z0-9_-]{3,20}$"
            title="Username must be 3-20 characters long and can only contain letters, numbers, underscores, and dashes."
          />
          <Input
            data-cy="email"
            value={emailInput}
            onChange={emailInputSetValue}
            type="email"
            placeholder="Email"
            required
          />
          <Input
            data-cy="password"
            value={passwordInput}
            onChange={passwordInputSetValue}
            type="password"
            placeholder="Password"
            required
            minLength={6}
            title="Password must be at least 6 characters long."
          />
          <Button primary={true} data-cy="submit" variant="blue">
            {state !== 1 ? "Sign up" : "..."}
          </Button>
        </form>
      )}
      <p className={paragraphClass}>
        Already have an account?{" "}
        <Link className={linkClass} href="/auth/signin">
          LOG IN
        </Link>
      </p>
    </>
  );
}
