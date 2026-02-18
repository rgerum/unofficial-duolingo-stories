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

const PENDING_SIGNIN_STORAGE_KEY = "posthog_pending_signin";

export function LoginOptions(props: {
  providers: ProviderProps[];
  callbackUrl: string;
}) {
  const paragraphClass = "m-0";
  const headingClass = "m-0 text-[calc(24/16*1rem)]";
  const linkClass =
    "m-0 w-auto cursor-pointer border-none bg-transparent text-[1em] font-bold text-[var(--link-blue)] no-underline";
  const alertErrorClass =
    "block w-full rounded-[10px] bg-[var(--error-red)] p-[10px] text-white";
  const providersClass = "grid grid-cols-2 gap-x-4";
  const oauthButtonClass =
    "mt-2 mb-2 flex w-full cursor-pointer items-center rounded-[15px] border-[var(--overview-hr)] border-b-4 border-l-2 border-r-2 border-t-2 bg-[var(--body-background)] px-[30px] py-[13px] pr-0 text-[1rem] font-bold uppercase text-[var(--text-color)] transition-[box-shadow,transform] duration-100 hover:brightness-90";

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
      <h1 className={headingClass}>Log in</h1>
      <p className={paragraphClass}>
        Attention, you cannot login with your Duolingo account.
      </p>
      <p className={paragraphClass}>
        You have to register for the unofficial stories separately, as they are
        an independent project.
      </p>
      {state.error && <span className={alertErrorClass}>{state.error}</span>}
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
        <Button data-cy="submit" primary>
          {isPending ? <SpinnerBlue /> : "Log in"}
        </Button>
      </form>
      <p className={paragraphClass}>
        {"Don't have an account? "}
        <Link
          href="/auth/register"
          data-cy="register-button"
          className={linkClass}
        >
          Sign Up
        </Link>
        <br />
        Forgot Password?{" "}
        <Link
          href="/auth/reset_pw"
          data-cy="reset-button"
          className={linkClass}
        >
          Reset
        </Link>
      </p>
      <hr className="relative h-0 w-full overflow-visible border-0 border-t-2 border-[var(--input-border)] before:relative before:top-[calc(-1em+2px)] before:bg-[var(--body-background)] before:px-[0.4em] before:text-[var(--input-border)] before:content-['or']" />
      <div className={providersClass}>
        {providers.map((provider) => (
          <button
            key={provider.id}
            className={oauthButtonClass}
            onClick={() => handleOAuthProviderClick(provider)}
          >
            <GetIcon name={provider.id} />
            <span className="ml-[10px]">{provider.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
