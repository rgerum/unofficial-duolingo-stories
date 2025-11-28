"use client";
import React from "react";
import { redirect } from "next/navigation";
import ResetPassword from "./reset_pw";
import { authClient } from "@/lib/authClient";

export default function Page({}) {
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (!isPending && session) {
    redirect("/");
  }

  return <ResetPassword />;
}
