"use client";
import React from "react";
import { useInput } from "@/lib/hooks";
import Header from "../header";
import styles from "./profile.module.css";
import ProviderButton from "./button";
import Link from "next/link";
import { ProfileData } from "@/app/(stories)/(main)/profile/page";
import Button from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function Profile({ providers }: { providers: ProfileData }) {
  let [username, setUsername] = useInput(providers.name);
  const [newEmail, setNewEmail] = useInput("");
  const [resetState, setResetState] = React.useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [resetError, setResetError] = React.useState("");
  const [emailState, setEmailState] = React.useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [emailError, setEmailError] = React.useState("");
  const [pendingEmailChange, setPendingEmailChange] = React.useState("");

  React.useEffect(() => {
    const storedPendingEmail = window.localStorage.getItem(
      "profile_pending_email_change",
    );
    if (!storedPendingEmail) return;

    if (storedPendingEmail.toLowerCase() === providers.email.toLowerCase()) {
      window.localStorage.removeItem("profile_pending_email_change");
      setPendingEmailChange("");
      return;
    }

    setPendingEmailChange(storedPendingEmail);
  }, [providers.email]);

  async function requestPasswordReset() {
    setResetState("pending");
    setResetError("");

    try {
      await authClient.requestPasswordReset({
        email: providers.email,
        redirectTo: `${window.location.origin}/auth/reset_pw`,
      });
      setResetState("success");
    } catch (e) {
      setResetState("error");
      setResetError((e as Error)?.message || "Could not send reset link.");
    }
  }

  async function requestEmailChange() {
    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValidation.test(newEmail)) {
      setEmailState("error");
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (newEmail.toLowerCase() === providers.email.toLowerCase()) {
      setEmailState("error");
      setEmailError("This is already your current email address.");
      return;
    }

    setEmailState("pending");
    setEmailError("");
    const { error } = await authClient.changeEmail({
      newEmail,
      callbackURL: `${window.location.origin}/profile`,
    });
    if (error) {
      setEmailState("error");
      setEmailError(error.message || "Could not start email change.");
      return;
    }
    window.localStorage.setItem("profile_pending_email_change", newEmail);
    setPendingEmailChange(newEmail);
    setEmailState("success");
  }

  return (
    <>
      <Header>
        <h1>Profile</h1>
        <p>Your user profile, its assigned roles and linked login accounts.</p>
      </Header>
      <div className={styles.profile}>
        <div>
          Username: <input value={username} onChange={setUsername} />
        </div>
        <div>
          Email: <input value={providers.email} readOnly />
        </div>
        <div className={styles.roles}>
          {providers.role.length ? (
            providers.role.map((d, i) => <span key={i}>{d}</span>)
          ) : (
            <></>
          )}
        </div>

        <h2>Linked Accounts</h2>
        <span>
          When you have linked your account to a login provider you can use these
          providers instead of login in with username and password or email.
        </span>
        <div className={styles.links}>
          {Object.entries(providers.provider_linked).map(([key, value]) => (
            <ProviderButton key={key} d={key} value={value} />
          ))}
        </div>

        <h2>Change Password</h2>
        <p>
          For security, we will email you a password reset link instead of
          changing your password directly here.
        </p>
        {resetState === "error" && (
          <span className={styles.resetError}>{resetError}</span>
        )}
        {resetState === "success" && (
          <span className={styles.resetMessage} data-cy="profile-reset-message">
            Check your email for the password reset link.
          </span>
        )}
        <Button
          type="button"
          primary={true}
          data-cy="profile-reset-password"
          onClick={requestPasswordReset}
          disabled={resetState === "pending"}
        >
          {resetState === "pending" ? "Sending..." : "Send Password Reset Link"}
        </Button>

        <h2>Change Email</h2>
        <p>
          Enter your new email address. For safety, email changes are processed
          in two steps.
        </p>
        {pendingEmailChange && (
          <span className={styles.resetMessage} data-cy="profile-email-pending">
            Current email: {providers.email}. Pending change: {pendingEmailChange}
            . Confirm the link sent to your new email to complete the update.
          </span>
        )}
        <input
          type="email"
          value={newEmail}
          onChange={setNewEmail}
          placeholder="New email address"
          data-cy="profile-new-email"
        />
        {emailState === "error" && (
          <span className={styles.resetError}>{emailError}</span>
        )}
        {emailState === "success" && (
          <span className={styles.resetMessage} data-cy="profile-email-message">
            Check your current email, then your new email for confirmation links.
          </span>
        )}
        <Button
          type="button"
          primary={true}
          data-cy="profile-change-email"
          onClick={requestEmailChange}
          disabled={emailState === "pending"}
        >
          {emailState === "pending" ? "Sending..." : "Request Email Change"}
        </Button>

        <h2>Delete Account</h2>
        <p>
          If you want to delete your account, please contact use on{" "}
          <Link href="https://discord.gg/4NGVScARR3">Discord</Link>. We will
          typically delete your username and email address upon request.
        </p>
      </div>
    </>
  );
}
