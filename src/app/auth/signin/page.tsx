import React from "react";
import { redirect } from "next/navigation";
import { LoginOptions } from "./login_options";
import { isAuthenticated } from "@/lib/auth-server";

export interface ProviderProps {
  id: string;
  name: string;
}

const getEnv = (...keys: string[]) =>
  keys.map((key) => process.env[key]).find((value) => value);

const hasProvider = (idKeys: string[], secretKeys: string[]) =>
  Boolean(getEnv(...idKeys) && getEnv(...secretKeys));

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await isAuthenticated();

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    redirect("/");
  }

  const providers: ProviderProps[] = [];

  if (
    hasProvider(
      ["FACEBOOK_CLIENT_ID", "AUTH_FACEBOOK_ID"],
      ["FACEBOOK_CLIENT_SECRET", "AUTH_FACEBOOK_SECRET"],
    )
  ) {
    providers.push({ id: "facebook", name: "Facebook" });
  }

  if (
    hasProvider(
      ["GITHUB_CLIENT_ID", "GITHUB_ID", "AUTH_GITHUB_ID"],
      ["GITHUB_CLIENT_SECRET", "GITHUB_SECRET", "AUTH_GITHUB_SECRET"],
    )
  ) {
    providers.push({ id: "github", name: "GitHub" });
  }

  if (
    hasProvider(
      ["DISCORD_CLIENT_ID", "AUTH_DISCORD_CLIENT_ID"],
      ["DISCORD_CLIENT_SECRET", "AUTH_DISCORD_CLIENT_SECRET"],
    )
  ) {
    providers.push({ id: "discord", name: "Discord" });
  }

  if (
    hasProvider(
      ["GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID"],
      ["GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET"],
    )
  ) {
    providers.push({ id: "google", name: "Google" });
  }

  const callbackUrl = Array.isArray(resolvedSearchParams?.callbackUrl)
    ? resolvedSearchParams?.callbackUrl[0]
    : resolvedSearchParams?.callbackUrl || "/";

  return <LoginOptions providers={providers} callbackUrl={callbackUrl} />;
}
