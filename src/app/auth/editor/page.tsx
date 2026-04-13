import React from "react";
import Link from "@/lib/router";
import {
  buttonInnerClassName,
  buttonRootClassName,
} from "@/components/ui/button";

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
        className={buttonRootClassName({
          className: "inline-block no-underline",
          variant: "primary",
        })}
      >
        <span className={buttonInnerClassName({ variant: "primary" })}>
          Log In
        </span>
      </Link>
    </>
  );
}
