"use client";
import React from "react";
import styles from "../register.module.css";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const [state, setState] = React.useState(0);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [emailInput, emailInputSetValue] = useInput("");
  const [passwordInput, passwordInputSetValue] = useInput("");

  async function requestReset() {
    const emailValidation = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailValidation.test(emailInput)) {
      let msg = "Not a valid email, please try again.";
      setError(msg);
      setState(-1);
      return;
    }

    setState(1);
    try {
      await authClient.requestPasswordReset({
        email: emailInput,
        redirectTo: `${window.location.origin}/auth/reset_pw`,
      });
    } catch (e) {
      setState(-1);
      setError("An Error occurred." + e);
      return;
    }
    setMessage(
      "If the account exists an email was sent out with a link to reset the password.",
    );
    setState(2);
  }

  async function resetPassword() {
    if (!token) return;
    if (passwordInput.length < 6) {
      setError("Password must be at least 6 characters long.");
      setState(-1);
      return;
    }
    setState(1);
    const { error: resetError } = await authClient.resetPassword({
      token,
      newPassword: passwordInput,
    });
    if (resetError) {
      setError(resetError.message || "An Error occurred.");
      setState(-1);
      return;
    }
    setState(2);
    setMessage("Your password has been changed. You can now log in.");
  }
  const handleKeypressSignup = (e: React.KeyboardEvent) => {
    // listens for enter key
    if (e.keyCode === 13) {
      if (token) {
        resetPassword();
      } else {
        requestReset();
      }
    }
  };

  return (
    <>
      <h1 className={styles.H1}>Reset Password</h1>
      <p className={styles.P}>
        {token
          ? "Enter your new password."
          : "You forgot your password? We can send you a link to reset it."}
      </p>
      {errorParam && (
        <span className={styles.error}>
          {errorParam === "INVALID_TOKEN"
            ? "This reset link is invalid or expired."
            : errorParam}
        </span>
      )}
      {state === -1 && <span className={styles.error}>{error}</span>}
      {state === 2 ? (
        <span className={styles.message} data-cy="message-confirm">
          {message}
        </span>
      ) : (
        <form
          action={token ? resetPassword : requestReset}
          className={styles.Form}
        >
          {token ? (
            <Input
              data-cy="password"
              value={passwordInput}
              onChange={passwordInputSetValue}
              onKeyDown={handleKeypressSignup}
              type="password"
              placeholder="Password"
              minLength={6}
            />
          ) : (
            <Input
              data-cy="email"
              value={emailInput}
              onChange={emailInputSetValue}
              onKeyDown={handleKeypressSignup}
              type="email"
              name="email"
              placeholder="Email"
            />
          )}
          <Button primary={true} data-cy="submit" type="submit" variant="blue">
            {state !== 1 ? (token ? "Set Password" : "Send Link") : "..."}
          </Button>
        </form>
      )}
      <p className={styles.P}>
        Already have an account?{" "}
        <Link className={styles.link} href="/auth/signin">
          LOG IN
        </Link>
      </p>
    </>
  );
}
