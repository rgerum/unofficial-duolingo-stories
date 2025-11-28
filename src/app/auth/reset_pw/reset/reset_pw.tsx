"use client";
import React from "react";
import styles from "../../register.module.css";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/authClient";

export default function ResetPassword() {
  const [state, setState] = React.useState(0);
  const [error, setError] = React.useState("");

  const [passwordInput, passwordInputSetValue] = useInput("");

  const token = useSearchParams().get("token");

  if (!token || token == "VALID_TOKEN") {
    return (
      <>
        <h2>Reset Password</h2>
        <span className={styles.error}>No token provided.</span>
      </>
    );
  }

  async function register_button() {
    setState(1);
    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: passwordInput, // required
        token, // required
      });
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
          <Link href="/auth/signin" data-cy="log-in">
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
