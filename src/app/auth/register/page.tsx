import React from "react";
import { redirect } from "next/navigation";
import Register from "./register";
import { authClient } from "@/lib/authClient";

export default async function Page({}) {
  const { data: session } = await authClient.getSession();

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    redirect("/");
  }

  return <Register />;
}
