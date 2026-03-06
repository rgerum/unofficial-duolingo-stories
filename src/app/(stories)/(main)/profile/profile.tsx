"use client";
import React from "react";
import { useInput } from "@/lib/hooks";
import Header from "../header";
import ProviderButton from "./button";
import Link from "next/link";
import { ProfileData } from "@/app/(stories)/(main)/profile/page";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const sectionHeadingClass =
  "mt-7 mb-2.5 text-left text-[calc(28/16*1rem)] font-bold leading-[1.2] max-[480px]:mt-[22px] max-[480px]:text-[calc(24/16*1rem)]";
const successMessageClass = "mt-2 block text-[var(--button-border)]";
const errorMessageClass = "mt-2 block text-[var(--error-red)]";
const roleBadgeClass =
  "mx-[5px] rounded-[10px] bg-[var(--header-border)] px-[10px] py-[5px]";

export default function Profile({ providers }: { providers: ProfileData }) {
  let [username, setUsername] = useInput(providers.username || providers.name);
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
  const [usernameState, setUsernameState] = React.useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [usernameError, setUsernameError] = React.useState("");
  const [savedUsername, setSavedUsername] = React.useState(
    providers.username || providers.name,
  );

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

  async function saveUsername() {
    const normalizedUsername = username.trim();
    const usernameValidation = /^[a-zA-Z0-9_-]{3,20}$/;

    if (!usernameValidation.test(normalizedUsername)) {
      setUsernameState("error");
      setUsernameError(
        "Username must be 3-20 characters and use only letters, numbers, _ or -.",
      );
      return;
    }

    if (normalizedUsername === savedUsername) {
      setUsernameState("success");
      setUsernameError("");
      return;
    }

    setUsernameState("pending");
    setUsernameError("");

    const { error } = await authClient.updateUser({
      username: normalizedUsername,
      name: normalizedUsername,
    });

    if (error) {
      setUsernameState("error");
      const errorCode =
        typeof (error as { code?: unknown })?.code === "string"
          ? (error as { code: string }).code
          : "";
      const errorMessage =
        typeof error.message === "string" ? error.message : "";
      const isUsernameTaken =
        errorCode === "USERNAME_IS_ALREADY_TAKEN" ||
        errorMessage.toLowerCase().includes("username is already taken");
      setUsernameError(
        isUsernameTaken
          ? "That username is already taken. Please choose another one."
          : errorMessage || "Could not update username.",
      );
      return;
    }

    setSavedUsername(normalizedUsername);
    setUsernameState("success");
  }

  return (
    <>
      <Header>
        <h1>Profile</h1>
        <p>Your user profile, its assigned roles and linked login accounts.</p>
      </Header>
      <div>
        <div>
          <label className="block">
            <span>Username:</span>
            <Input
              className="mt-2 max-w-full"
              value={username}
              onChange={setUsername}
            />
          </label>
          {usernameState === "error" && (
            <span className={errorMessageClass}>{usernameError}</span>
          )}
          {usernameState === "success" && (
            <span className={successMessageClass}>Username saved.</span>
          )}
          <Button
            type="button"
            primary={true}
            onClick={saveUsername}
            disabled={
              usernameState === "pending" || username.trim() === savedUsername
            }
          >
            {usernameState === "pending" ? "Saving..." : "Save Username"}
          </Button>
        </div>
        <div>
          <label className="block">
            <span>Email:</span>
            <Input
              className="mt-2 max-w-full"
              value={providers.email}
              readOnly
            />
          </label>
        </div>
        <div className="mt-2.5">
          {providers.role.length ? (
            providers.role.map((d, i) => (
              <span key={i} className={roleBadgeClass}>
                {d}
              </span>
            ))
          ) : (
            <></>
          )}
        </div>

        <h2 className={sectionHeadingClass}>Linked Accounts</h2>
        <span>
          When you have linked your account to a login provider you can use
          these providers instead of login in with username and password or
          email.
        </span>
        <div className="mt-2.5 flex flex-wrap items-center justify-center">
          {Object.entries(providers.provider_linked).map(([key, value]) => (
            <ProviderButton key={key} d={key} value={value} />
          ))}
        </div>

        <h2 className={sectionHeadingClass}>Change Password</h2>
        <p>
          For security, we will email you a password reset link instead of
          changing your password directly here.
        </p>
        {resetState === "error" && (
          <span className={errorMessageClass}>{resetError}</span>
        )}
        {resetState === "success" && (
          <span className={successMessageClass} data-cy="profile-reset-message">
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

        <h2 className={sectionHeadingClass}>Change Email</h2>
        <p>
          Enter your new email address. For safety, email changes are processed
          in two steps.
        </p>
        {pendingEmailChange && (
          <span className={successMessageClass} data-cy="profile-email-pending">
            Current email: {providers.email}. Pending change:{" "}
            {pendingEmailChange}. Confirm the link sent to your new email to
            complete the update.
          </span>
        )}
        <Input
          className="mt-2 max-w-full"
          type="email"
          value={newEmail}
          onChange={setNewEmail}
          placeholder="New email address"
          data-cy="profile-new-email"
        />
        {emailState === "error" && (
          <span className={errorMessageClass}>{emailError}</span>
        )}
        {emailState === "success" && (
          <span className={successMessageClass} data-cy="profile-email-message">
            Check your current email, then your new email for confirmation
            links.
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

        <h2 className={sectionHeadingClass}>Delete Account</h2>
        <p>
          If you want to delete your account, please contact use on{" "}
          <Link href="https://discord.gg/4NGVScARR3">Discord</Link>. We will
          typically delete your username and email address upon request.
        </p>
      </div>
    </>
  );
}
