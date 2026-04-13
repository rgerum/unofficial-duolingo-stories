import React from "react";
import { redirect } from "@/lib/router";
import Register from "./register";
import { isAuthenticated } from "@/lib/auth-server";

export default async function Page({}) {
  const session = await isAuthenticated();

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    redirect("/");
  }

  return <Register />;
}
