import React from "react";
import { redirect } from "next/navigation";
import ResetPassword from "./reset_pw";
import { isAuthenticated } from "@/lib/auth-server";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = Array.isArray(resolvedSearchParams?.token)
    ? resolvedSearchParams?.token[0]
    : resolvedSearchParams?.token;
  const session = await isAuthenticated();

  // If the user is already logged in, redirect to home unless
  // this is a token-based password reset flow.
  if (session && !token) {
    redirect("/");
  }

  return <ResetPassword />;
}
