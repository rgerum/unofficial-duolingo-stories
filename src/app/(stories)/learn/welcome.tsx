"use client";
import Link from "next/link";
import React from "react";

export default function Page() {
  const authButtonClass =
    "mt-2 mb-2 inline-block w-full cursor-pointer rounded-[15px] border-[var(--button-blue-border)] border-b-4 [border-left-width:var(--button-side-border)] [border-right-width:var(--button-side-border)] [border-top-width:var(--button-side-border)] bg-[var(--button-blue-background)] px-[30px] py-[13px] pr-0 text-center text-[1rem] font-bold uppercase text-[var(--button-blue-color)] no-underline transition-[box-shadow,transform] duration-100 hover:brightness-110";

  return (
    <div className="flex h-screen flex-col items-center justify-center px-[15px]">
      <div className="m-5 block text-center">
        <h1>Welcome to Duostories</h1>
        <img src={"icon192.png"} alt="icon" />
        <p>Log in to proceed</p>
        <Link href={`/auth/signin?callbackUrl=/`} className={authButtonClass}>
          Sign in
        </Link>
        <Link href="/auth/register" className={authButtonClass}>
          Register
        </Link>
        <hr />
        <Link href={"/"} className={`${authButtonClass} text-[var(--text-color)]`}>
          Anonymous
        </Link>
      </div>
    </div>
  );
}
