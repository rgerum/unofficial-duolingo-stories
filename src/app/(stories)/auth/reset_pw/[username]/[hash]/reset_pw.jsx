"use client";
import React from "react";
import styles from "../../../register.module.css";
import { useInput } from "lib/hooks";
import Link from "next/link";

export default function ResetPassword({ callchangePasswordAction }) {
  let [state, setState] = React.useState(0);
  let [error, setError] = React.useState("");

  let [passwordInput, passwordInputSetValue] = useInput("");

  async function register_button() {
    setState(1);
    try {
      await callchangePasswordAction(passwordInput);
      setState(1);
    } catch (e) {
      setState(-1);
      setError("An Error occurred." + e);
    }
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
      <h2>Reset Password</h2>
      {state === -1 ? <span className={styles.error}>{error}</span> : <></>}
      {state === 2 ? (
        <span>
          Your password has been changed. You can now{" "}
          <Link href="/api/auth/signin" data-cy="log-in">
            log in
          </Link>
        </span>
      ) : (
        <>
          <p>Enter your new password.</p>
          <form action={register_button}>
            <input
              data-cy="password"
              value={passwordInput}
              onChange={passwordInputSetValue}
              onKeyDown={handleKeypressSignup}
              type="password"
              placeholder="Password"
            />
            <button
              data-cy="submit"
              type="submit"
              className={styles.button}
              //onClick={register_button}
            >
              {state !== 1 ? "Set Password" : "..."}
            </button>
          </form>
        </>
      )}
    </>
  );
}
