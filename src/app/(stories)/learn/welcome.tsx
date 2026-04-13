"use client";
import Link from "@/lib/router";
import React from "react";
import {
  buttonInnerClassName,
  buttonRootClassName,
} from "@/components/ui/button";

export default function Page() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#ddf4ff_0%,#ffffff_45%,#f6fbef_100%)] px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[color:color-mix(in_srgb,var(--button-background)_18%,transparent)] blur-3xl" />
      <main className="relative w-full max-w-[440px] rounded-[32px] border border-[color:color-mix(in_srgb,var(--overview-hr)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--body-background)_92%,white)] p-8 text-center shadow-[0_28px_80px_rgba(28,176,246,0.14)] backdrop-blur">
        <div className="mx-auto flex max-w-[320px] flex-col items-center">
          <img
            src="/icon192.png"
            alt="Duostories logo"
            width={96}
            height={96}
            className="mb-5 h-24 w-24 rounded-[24px] border border-[color:color-mix(in_srgb,var(--overview-hr)_80%,transparent)] bg-white p-3 shadow-[0_12px_30px_rgba(28,176,246,0.16)]"
          />
          <p className="m-0 text-[0.82rem] font-extrabold uppercase tracking-[0.18em] text-[var(--link-blue)]">
            Learn with stories
          </p>
          <h1 className="m-0 mt-3 text-[calc(40/16*1rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--text-color)]">
            Welcome to Duostories
          </h1>
          <p className="m-0 mt-4 text-[calc(18/16*1rem)] leading-[1.55] text-[color:color-mix(in_srgb,var(--text-color-dim)_88%,transparent)]">
            Sign in to keep your reading progress, or continue anonymously and
            start learning right away.
          </p>
        </div>

        <nav
          aria-label="Authentication options"
          className="mt-8 flex flex-col gap-3"
        >
          <Link
            href="/auth/signin?callbackUrl=/"
            className={buttonRootClassName({
              className: "block w-full no-underline",
              variant: "primary",
            })}
          >
            <span className={buttonInnerClassName({ variant: "primary" })}>
              Sign in
            </span>
          </Link>
          <Link
            href="/auth/register"
            className={buttonRootClassName({
              className: "block w-full no-underline",
              variant: "primary",
            })}
          >
            <span className={buttonInnerClassName({ variant: "primary" })}>
              Register
            </span>
          </Link>
        </nav>

        <div className="my-6 flex items-center gap-3 text-[0.9rem] font-bold uppercase tracking-[0.14em] text-[color:color-mix(in_srgb,var(--text-color-dim)_70%,transparent)]">
          <span className="h-px flex-1 bg-[var(--overview-hr)]" />
          <span>or</span>
          <span className="h-px flex-1 bg-[var(--overview-hr)]" />
        </div>

        <Link
          href="/"
          className={buttonRootClassName({
            className: "block w-full no-underline",
            variant: "secondary",
          })}
        >
          <span className={buttonInnerClassName({ variant: "secondary" })}>
            Continue anonymously
          </span>
        </Link>
      </main>
    </div>
  );
}
