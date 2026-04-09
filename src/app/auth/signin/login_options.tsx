"use client";
import React from "react";
import Link from "next/link";
import { useInput } from "@/lib/hooks";
import posthog from "posthog-js";

import { GetIcon } from "@/components/icons";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { SpinnerBlue } from "@/components/ui/spinner";
import { ProviderProps } from "@/app/auth/signin/page";
import { authClient } from "@/lib/auth-client";
import {
  authAlertErrorClass,
  authHeadingClass,
  authInlineLinkClass,
  authParagraphClass,
} from "@/components/auth/styles";

const PENDING_SIGNIN_STORAGE_KEY = "posthog_pending_signin";

export function LoginOptions(props: {
  providers: ProviderProps[];
  callbackUrl: string;
}) {
  const providersClass = "grid grid-cols-2 gap-x-4";

  const { providers, callbackUrl } = props;

  const [state, setState] = React.useState<{ error: string | null }>({
    error: null,
  });
  const [isPending, setIsPending] = React.useState(false);

  const [usernameInput, usernameInputSetValue] = useInput("");
  const [passwordInput, passwordInputSetValue] = useInput("");

  const handleOAuthProviderClick = async (provider: ProviderProps) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        PENDING_SIGNIN_STORAGE_KEY,
        JSON.stringify({
          method: "oauth",
          provider: provider.id,
        }),
      );
    }

    posthog.capture("oauth_provider_clicked", {
      provider: provider.id,
      provider_name: provider.name,
    });
    const { data, error } = await authClient.signIn.social({
      provider: provider.id,
      callbackURL: callbackUrl,
    });
    if (error) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(PENDING_SIGNIN_STORAGE_KEY);
      }
      setState({ error: error.message ?? "Sign in error." });
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setState({ error: null });

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        PENDING_SIGNIN_STORAGE_KEY,
        JSON.stringify({
          method: "credentials",
        }),
      );
    }

    const { error } = await authClient.signIn.username({
      username: usernameInput,
      password: passwordInput,
      callbackURL: callbackUrl,
    });

    if (error) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(PENDING_SIGNIN_STORAGE_KEY);
      }
      setState({ error: error.message ?? "Sign in error." });
      setIsPending(false);
      return;
    }

    window.location.href = callbackUrl;
  };

  return (
    <>
      <h1 className={authHeadingClass}>Log in</h1>
      <p className={authParagraphClass}>
        Attention, you cannot login with your Duolingo account.
      </p>
      <p className={authParagraphClass}>
        You have to register for the unofficial stories separately, as they are
        an independent project.
      </p>
      {state.error && (
        <span className={authAlertErrorClass}>{state.error}</span>
      )}
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <Input
          data-cy="username"
          value={usernameInput}
          onChange={usernameInputSetValue}
          type="text"
          name="username"
          placeholder="Username"
        />
        <Input
          data-cy="password"
          value={passwordInput}
          onChange={passwordInputSetValue}
          type="password"
          name="password"
          placeholder="Password"
        />
        <Button data-cy="submit" variant="primary">
          {isPending ? <SpinnerBlue /> : "Log in"}
        </Button>
      </form>
      <p className={authParagraphClass}>
        {"Don't have an account? "}
        <Link
          href="/auth/register"
          data-cy="register-button"
          className={authInlineLinkClass}
        >
          Sign Up
        </Link>
        <br />
        Forgot Password?{" "}
        <Link
          href="/auth/reset_pw"
          data-cy="reset-button"
          className={authInlineLinkClass}
        >
          Reset
        </Link>
      </p>
      <hr className="relative my-3 h-0 w-full overflow-visible border-0 border-t-2 border-[var(--input-border)] before:relative before:top-[calc(-1em+2px)] before:bg-[var(--body-background)] before:px-[0.4em] before:text-[var(--input-border)] before:content-['or']" />
      <div className={providersClass}>
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            className="mb-2 w-full min-w-0 [&>span]:px-5"
            onClick={() => handleOAuthProviderClick(provider)}
          >
            <span className="flex w-full min-w-0 items-center justify-center gap-3 whitespace-nowrap leading-none">
              <span className="inline-flex shrink-0 items-center justify-center">
                <GetIcon name={provider.id} />
              </span>
              <span className="min-w-0 truncate max-sm:hidden">
                {provider.name}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </>
  );
}
