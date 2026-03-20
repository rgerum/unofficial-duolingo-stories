"use client";

import React from "react";
import Link from "next/link";
import Header from "../header";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { GetIcon } from "@/components/icons";
import { useInput } from "@/lib/hooks";
import { authClient } from "@/lib/auth-client";
import type { ProfileData } from "./data";

const pageShellClass =
  "mx-auto mb-10 max-w-[860px] rounded-[28px] border border-[color:color-mix(in_srgb,var(--header-border)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--body-background)_94%,white)] p-4 shadow-[0_18px_56px_color-mix(in_srgb,#000_10%,transparent)] sm:p-6";
const cardClass =
  "rounded-[22px] border border-[color:color-mix(in_srgb,var(--header-border)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--body-background)_88%,transparent)] p-5";
const rowClass =
  "rounded-[18px] border border-[color:color-mix(in_srgb,var(--header-border)_38%,transparent)] bg-[color:color-mix(in_srgb,var(--body-background)_72%,var(--body-background-faint))] px-4 py-4";
const eyebrowClass =
  "text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--title-color-dim)]";
const labelClass =
  "mb-1 block text-[0.82rem] font-bold uppercase tracking-[0.08em] text-[var(--title-color-dim)]";
const successMessageClass = "mt-2 block text-[var(--button-border)]";
const errorMessageClass = "mt-2 block text-[var(--error-red)]";

function roleBadgeTone(role: string) {
  if (role === "Admin") {
    return "border-[color:color-mix(in_srgb,#ff9b55_60%,var(--header-border))] bg-[color:color-mix(in_srgb,#ff9b55_14%,transparent)]";
  }

  return "border-[color:color-mix(in_srgb,var(--button-blue-background)_45%,var(--header-border))] bg-[color:color-mix(in_srgb,var(--button-blue-background)_12%,transparent)]";
}

function StatusText({
  state,
  error,
  success,
  dataCy,
}: {
  state: "idle" | "pending" | "success" | "error";
  error?: string;
  success?: string;
  dataCy?: string;
}) {
  if (state === "error" && error) {
    return <span className={errorMessageClass}>{error}</span>;
  }

  if (state === "success" && success) {
    return (
      <span className={successMessageClass} data-cy={dataCy}>
        {success}
      </span>
    );
  }

  return null;
}

function SettingRow({
  label,
  value,
  helper,
  action,
  children,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={rowClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={labelClass}>{label}</p>
          <div className="text-[1rem] font-bold">{value}</div>
          {helper ? (
            <div className="mt-1 text-[0.92rem] text-[var(--title-color-dim)]">
              {helper}
            </div>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? (
        <div className="mt-4 border-t border-[color:color-mix(in_srgb,var(--header-border)_26%,transparent)] pt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function LinkedAccountRow({
  provider,
  linked,
}: {
  provider: string;
  linked: boolean;
}) {
  const [linkError, setLinkError] = React.useState<string | null>(null);

  const handleLink = async () => {
    setLinkError(null);
    const { data, error } = await authClient.linkSocial({
      provider,
      callbackURL: window.location.href,
    });

    if (error) {
      setLinkError(error.message || "Could not link account.");
      return;
    }
    if (data?.url) window.location.href = data.url;
  };

  return (
    <div className="rounded-[18px] border border-[color:color-mix(in_srgb,var(--header-border)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--body-background)_72%,var(--body-background-faint))] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[color:color-mix(in_srgb,var(--body-background)_82%,white)]">
          <GetIcon name={provider} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[1rem] font-bold capitalize">{provider}</p>
          <p className="m-0 text-[0.9rem] text-[var(--title-color-dim)]">
            {linked ? "Linked for sign in." : "Available to link."}
          </p>
        </div>
        {linked ? (
          <span className="inline-flex rounded-full border border-[color:color-mix(in_srgb,var(--header-border)_60%,transparent)] px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.08em]">
            Linked
          </span>
        ) : (
          <button
            type="button"
            onClick={handleLink}
            className="inline-flex rounded-full border border-[var(--button-blue-border)] bg-[var(--button-blue-background)] px-4 py-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--button-blue-color)] transition hover:brightness-105"
          >
            Link
          </button>
        )}
      </div>
      {linkError ? (
        <span className={errorMessageClass}>{linkError}</span>
      ) : null}
    </div>
  );
}

function ProfileAvatar({
  image,
  username,
}: {
  image: string | null;
  username: string;
}) {
  const initial = username.slice(0, 1).toUpperCase();
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage =
    typeof image === "string" && image.length > 0 && !imageFailed;

  if (showImage) {
    return (
      <img
        src={image}
        alt={`${username} profile`}
        className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[var(--profile-background)] p-0 text-center text-[40px] leading-none uppercase text-[var(--profile-text)]"
      aria-label={`${username} profile`}
      role="img"
    >
      <span>{initial}</span>
    </div>
  );
}

export default function Profile({ providers }: { providers: ProfileData }) {
  const { data: session } = authClient.useSession();
  const sessionUser = session?.user as
    | {
        name?: string | null;
        image?: string | null;
      }
    | undefined;
  const [username, setUsername] = useInput(
    providers.username || providers.name,
  );
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
  const [isEditingUsername, setIsEditingUsername] = React.useState(false);
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [isShowingPasswordReset, setIsShowingPasswordReset] =
    React.useState(false);
  const avatarName =
    sessionUser?.name?.trim() || savedUsername || providers.name || "U";
  const avatarImage = sessionUser?.image ?? providers.image;

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
    setIsEditingEmail(false);
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
      setIsEditingUsername(false);
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
    setIsEditingUsername(false);
  }

  return (
    <>
      <Header>
        <h1>Profile</h1>
        <p>Manage your account details and sign-in methods.</p>
      </Header>

      <div className={pageShellClass}>
        <section className={cardClass}>
          <p className={eyebrowClass}>Account</p>
          <div className="mt-2 flex flex-col gap-4 border-b border-[color:color-mix(in_srgb,var(--header-border)_30%,transparent)] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <ProfileAvatar image={avatarImage} username={avatarName} />
              <div>
                <h2 className="text-[1.6rem] font-bold leading-[1.1]">
                  {savedUsername}
                </h2>
                <p className="mb-0 mt-1 break-all text-[0.95rem] text-[var(--title-color-dim)]">
                  {providers.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {providers.role.length ? (
                providers.role.map((role) => (
                  <span
                    key={role}
                    className={`rounded-full border px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.08em] ${roleBadgeTone(role)}`}
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-[color:color-mix(in_srgb,var(--header-border)_55%,transparent)] px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--title-color-dim)]">
                  Standard user
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <SettingRow
              label="Username"
              value={savedUsername}
              action={
                <Button
                  type="button"
                  className="mt-0 min-w-[120px]"
                  onClick={() => {
                    setUsernameState("idle");
                    setUsernameError("");
                    setIsEditingUsername((current) => !current);
                  }}
                >
                  {isEditingUsername ? "Close" : "Edit"}
                </Button>
              }
            >
              {isEditingUsername ? (
                <div className="space-y-3">
                  <Input value={username} onChange={setUsername} />
                  <StatusText
                    state={usernameState}
                    error={usernameError}
                    success="Username saved."
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      primary={true}
                      onClick={saveUsername}
                      disabled={
                        usernameState === "pending" ||
                        username.trim() === savedUsername
                      }
                    >
                      {usernameState === "pending" ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      className="mt-0 min-w-[120px]"
                      onClick={() => setIsEditingUsername(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </SettingRow>

            <SettingRow
              label="Email"
              value={providers.email}
              helper={
                pendingEmailChange
                  ? `Pending change to ${pendingEmailChange}.`
                  : undefined
              }
              action={
                <Button
                  type="button"
                  className="mt-0 min-w-[120px]"
                  onClick={() => {
                    setEmailState("idle");
                    setEmailError("");
                    setIsEditingEmail((current) => !current);
                  }}
                >
                  {isEditingEmail ? "Close" : "Edit"}
                </Button>
              }
            >
              {isEditingEmail ? (
                <div className="space-y-3">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={setNewEmail}
                    placeholder="New email address"
                    data-cy="profile-new-email"
                  />
                  <StatusText
                    state={emailState}
                    error={emailError}
                    success="Check your current email, then your new email for confirmation links."
                    dataCy="profile-email-message"
                  />
                  {pendingEmailChange ? (
                    <div
                      className="text-[0.92rem] text-[var(--title-color-dim)]"
                      data-cy="profile-email-pending"
                    >
                      Current email: {providers.email}. Pending change:{" "}
                      {pendingEmailChange}.
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      primary={true}
                      data-cy="profile-change-email"
                      onClick={requestEmailChange}
                      disabled={emailState === "pending"}
                    >
                      {emailState === "pending"
                        ? "Sending..."
                        : "Request Email Change"}
                    </Button>
                    <Button
                      type="button"
                      className="mt-0 min-w-[120px]"
                      onClick={() => setIsEditingEmail(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </SettingRow>

            <SettingRow
              label="Password"
              value="Password reset via email"
              action={
                <Button
                  type="button"
                  className="mt-0 min-w-[120px]"
                  onClick={() =>
                    setIsShowingPasswordReset((current) => !current)
                  }
                >
                  {isShowingPasswordReset ? "Close" : "Reset"}
                </Button>
              }
            >
              {isShowingPasswordReset ? (
                <div className="space-y-3">
                  <StatusText
                    state={resetState}
                    error={resetError}
                    success="Check your email for the password reset link."
                    dataCy="profile-reset-message"
                  />
                  <Button
                    type="button"
                    primary={true}
                    data-cy="profile-reset-password"
                    onClick={requestPasswordReset}
                    disabled={resetState === "pending"}
                  >
                    {resetState === "pending"
                      ? "Sending..."
                      : "Send Password Reset Link"}
                  </Button>
                </div>
              ) : null}
            </SettingRow>
          </div>
        </section>

        <section className={`${cardClass} mt-5`}>
          <div className="flex flex-col gap-2 border-b border-[color:color-mix(in_srgb,var(--header-border)_30%,transparent)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={eyebrowClass}>Connected accounts</p>
              <h2 className="mt-1 text-[1.45rem] font-bold leading-[1.1]">
                Social sign-in
              </h2>
            </div>
            <p className="m-0 text-[0.9rem] text-[var(--title-color-dim)]">
              Link a provider to sign in without your password.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {Object.entries(providers.provider_linked).map(
              ([provider, linked]) => (
                <LinkedAccountRow
                  key={provider}
                  provider={provider}
                  linked={linked}
                />
              ),
            )}
          </div>
        </section>

        <section className={`${cardClass} mt-5`}>
          <p className={eyebrowClass}>Delete account</p>
          <h2 className="mt-1 text-[1.45rem] font-bold leading-[1.1]">
            Manual removal
          </h2>
          <p className="mb-0 mt-2 text-[0.96rem] leading-[1.65] text-[var(--title-color-dim)]">
            If you want to delete your account, contact us on{" "}
            <Link href="https://discord.gg/4NGVScARR3">Discord</Link>. We
            typically delete your username and email address upon request.
          </p>
        </section>
      </div>
    </>
  );
}
