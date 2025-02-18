"use client";
import React from "react";
import styles from "../register.module.css";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import sendPasswordAction from "./sendPasswordAction";
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

export async function reset_pw(data) {
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

export default function ResetPassword() {
  const [state, setState] = React.useState(0);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [emailInput, emailInputSetValue] = useInput("");

  async function register_button() {
    const emailValidation = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w+)+$/;
    if (!emailValidation.test(emailInput)) {
      let msg = "Not a valid email, please try again.";
      setError(msg);
      setState(-1);
      return;
    }

    setState(1);
    try {
      await sendPasswordAction(emailInput);
      setState(1);
    } catch (e) {
      setState(-1);
      setError("An Error occurred." + e);
    }
    setMessage(
      "If the account exists an email was sent out with a link to reset the password.",
    );
    setState(2);
  }
  const handleKeypressSignup = (e) => {
    // listens for enter key
    if (e.keyCode === 13) {
      register_button();
    }
  };

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
        <Link className={styles.link} href="/api/auth/signin">
          LOG IN
        </Link>
      </p>
    </>
  );
}
