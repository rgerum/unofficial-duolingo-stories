"use client";
import React from "react";
import { useInput } from "@/lib/hooks";
import Header from "../header";
import styles from "./profile.module.css";
import ProviderButton from "./button";
import Link from "next/link";
import { ProfileData } from "@/app/(stories)/(main)/profile/page";
import Button from "@/components/layout/button";
import { authClient } from "@/lib/auth-client";

export default function Profile({ providers }: { providers: ProfileData }) {
  let [username, setUsername] = useInput(providers.name);
  let [email, setEmail] = useInput(providers.email);
  const [resetState, setResetState] = React.useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [resetError, setResetError] = React.useState("");

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
          Email: <input value={email} onChange={setEmail} />
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
          When you have liked your account to a login provider you can use these
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
