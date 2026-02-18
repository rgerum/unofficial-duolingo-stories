"use client";
import Link from "next/link";
import React from "react";
import { authPrimaryBlueActionClass } from "@/components/auth/styles";

export default function Page() {
  return (
    <div className="flex h-screen flex-col items-center justify-center px-[15px]">
      <div className="m-5 block text-center">
        <h1>Welcome to Duostories</h1>
        <img src={"icon192.png"} alt="icon" />
        <p>Log in to proceed</p>
        <Link
          href={`/auth/signin?callbackUrl=/`}
          className={authPrimaryBlueActionClass}
        >
          Sign in
        </Link>
        <Link href="/auth/register" className={authPrimaryBlueActionClass}>
          Register
        </Link>
        <hr />
        <Link
          href={"/"}
          className={`${authPrimaryBlueActionClass} text-[var(--text-color)]`}
        >
          Anonymous
        </Link>
      </div>
    </div>
  );
}
