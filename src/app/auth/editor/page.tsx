import React from "react";
import Link from "next/link";
import { authPrimaryBlueActionClass } from "@/components/auth/styles";

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
        className={authPrimaryBlueActionClass}
      >
        Log In
      </Link>
    </>
  );
}
