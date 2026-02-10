import React from "react";
import { redirect } from "next/navigation";
import ResetPassword from "./reset_pw";
import { isAuthenticated } from "@/lib/auth-server";

export default async function Page({}) {
  const session = await isAuthenticated();

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    redirect("/");
  }

  return <ResetPassword />;
}
