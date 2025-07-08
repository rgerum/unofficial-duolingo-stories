"use client";
import Head from "next/head";
import React from "react";
import styles from "../register.module.css";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import Button from "@/components/layout/button";
import Input from "@/components/layout/Input";

export async function fetch_post(url, data) {
  let req = new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    mode: "cors",
    credentials: "include",
  });
  return fetch(req);
}

export async function register(data) {
  let response;
  try {
    response = await fetch_post(`/auth/register/send`, data);
  } catch (e) {
    console.log(e);
    return [false, "Something went wrong."];
  }

  if (response.status === 403) {
    let text = await response.text();
    return [false, text];
  } else if (response.status !== 200) {
    return [false, "Something went wrong."];
  }

  return [true, ""];
}

export default function Register() {
  const [state, setState] = React.useState(0);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [usernameInput, usernameInputSetValue] = useInput("");
  const [passwordInput, passwordInputSetValue] = useInput("");
  const [emailInput, emailInputSetValue] = useInput("");

  function validateInputs() {
    const emailValidation = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
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

  async function register_button(event) {
    event.preventDefault(); // Prevent form submission from refreshing the page

    if (!validateInputs()) {
      setState(-1);
      return;
    }

    setState(1);
    const [success, msg] = await register({
      name: usernameInput,
      password: passwordInput,
      email: emailInput,
    });

    if (!success) {
      setError(msg || "Something went wrong.");
      setState(-1);
    } else {
      setState(2);
      setMessage(
        "Your account has been registered. An e-mail with an activation link has been sent to you. Please click on the link in the e-mail to proceed. You may need to look into your spam folder.",
      );
    }
  }

  return (
    <>
      <Head>
        <title>Duostories Login</title>
        <link rel="canonical" href={`https://duostories.org/login`} />
      </Head>

      <h1 className={styles.H1}>Sign up</h1>
      <p className={styles.P}>
        If you register you can keep track of the stories you have already
        finished.
      </p>
      <p className={styles.P}>
        Registration is optional, stories can be accessed even without login.
      </p>
      {state === -1 && <span className={styles.error}>{error}</span>}
      {state === 2 && (
        <span className={styles.message} data-cy="message-confirm">
          {message}
        </span>
      )}
      {state !== 2 && (
        <form onSubmit={register_button} className={styles.Form}>
          <Input
            data-cy="username"
            value={usernameInput}
            onChange={usernameInputSetValue}
            type="text"
            placeholder="Username"
            required
            pattern="[a-zA-Z0-9_-]{3,20}"
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
      <p className={styles.P}>
        Already have an account?{" "}
        <Link className={styles.link} href="/api/auth/signin">
          LOG IN
        </Link>
      </p>
    </>
  );
}
