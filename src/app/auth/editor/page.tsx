import React from "react";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <h1 className="m-0 text-[calc(24/16*1rem)]">Not Allowed</h1>
      <p className="m-0">
        You need to be logged in with an account that has a contributor role.
      </p>
      <p className="m-0">
        If you want to contribute ask us on{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
      </p>
      <p className="m-0">
        You might need to login and out again after you got access to the
        editor.
      </p>
      <Link
        href="/auth/signin"
        className="mt-2 mb-2 inline-block w-full cursor-pointer rounded-[15px] border-[var(--button-blue-border)] border-b-4 [border-left-width:var(--button-side-border)] [border-right-width:var(--button-side-border)] [border-top-width:var(--button-side-border)] bg-[var(--button-blue-background)] px-[30px] py-[13px] pr-0 text-center text-[1rem] font-bold uppercase text-[var(--button-blue-color)] no-underline transition-[box-shadow,transform] duration-100 hover:brightness-110"
      >
        Log In
      </Link>
    </>
  );
}
