"use client";
import React from "react";
import Button from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Page({}) {
  const router = useRouter();

  return (
    <>
      <h1 className="m-0 text-[calc(24/16*1rem)]">Not Allowed</h1>
      <p className="m-0">
        You need to be logged in with an account that has an admin role.
      </p>

      <Button primary={true} onClick={() => router.push("/auth/signin")}>
        Log In
      </Button>
    </>
  );
}
