"use client";
//import {LoginDialog} from "@/components/login";
import Head from "next/head";
import React from "react";
import styles from "../register.module.css";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import Button from "@/components/layout/button";
import Input from "@/components/layout/Input";

export async function fetch_post(url, data) {
  // check if the user is logged in
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
  // register a new user
  let response;
  try {
    response = await fetch_post(`/auth/register/send`, data);
  } catch (e) {
    // something wrong :-(
    console.log(e);
    return [false, "Something went wrong."];
  }
  // not allowed? perhaps the username is already taken
  if (response.status === 403) {
    let text = await response.text();
    return [false, text];
  }
  // again something wrong?
  else if (response.status !== 200) {
    return [false, "Something went wrong."];
  }
  // everything ok!
  return [true, ""];
}

export default function Register() {
  const [state, setState] = React.useState(0);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [usernameInput, usernameInputSetValue] = useInput("");
  const [passwordInput, passwordInputSetValue] = useInput("");
  const [emailInput, emailInputSetValue] = useInput("");

  async function register_button() {
    const emailValidation = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w+)+$/;
    if (!emailValidation.test(emailInput)) {
      let msg = "Not a valid email, please try again.";
      setError(msg);
      setState(-1);
    } else if (!passwordInput) {
      setState(-1);
      setError("Please enter a password");
    } else {
      setState(1);
      let [success, msg] = await register({
        name: usernameInput,
        password: passwordInput,
        email: emailInput,
      });

      if (success === false) {
        if (msg === "") msg = "Something went wrong.";
        setError(msg);
        setState(-1);
      } else {
        setState(2);
        setMessage(
          "Your account has been registered. An e-mail with an activation link has been sent to you. Please click on the link in the e-mail to proceed. You may need to look into your spam folder.",
        );
      }
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
      {state === -1 ? <span className={styles.error}>{error}</span> : <></>}
      {state === 2 ? (
        <span className={styles.message} data-cy="message-confirm">
          {message}
        </span>
      ) : (
        <form action={register_button} className={styles.Form}>
          <Input
            data-cy="username"
            value={usernameInput}
            onChange={usernameInputSetValue}
            type="text"
            placeholder="Username"
          />
          <Input
            data-cy="email"
            value={emailInput}
            onChange={emailInputSetValue}
            type="email"
            placeholder="Email"
          />
          <Input
            data-cy="password"
            value={passwordInput}
            onChange={passwordInputSetValue}
            type="password"
            placeholder="Password"
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
