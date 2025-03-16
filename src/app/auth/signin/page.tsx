import { auth, signIn } from "@/auth";

import React from "react";
import { redirect } from "next/navigation";
import { LoginOptions } from "./login_options";

export interface ProviderProps {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
  action: () => void;
}

export default async function Page({}) {
  const session = await auth();

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    redirect("/");
  }

  const signin_action = async (
    state: { error: string | null },
    formData: FormData,
  ): Promise<{ error: string | null }> => {
    "use server";
    try {
      await signIn("credentials", formData);
      return { error: null };
    } catch (error) {
      return { error: "Invalid credentials" };
    }
  };

  let providers: ProviderProps[] = [
    {
      id: "facebook",
      name: "Facebook",
      type: "oauth",
      signinUrl: "http://localhost:3000/api/auth/signin/facebook",
      callbackUrl: "http://localhost:3000/api/auth/callback/facebook",
      action: async () => {
        "use server";
        await signIn("facebook");
      },
    },
    {
      id: "github",
      name: "GitHub",
      type: "oauth",
      signinUrl: "http://localhost:3000/api/auth/signin/github",
      callbackUrl: "http://localhost:3000/api/auth/callback/github",
      action: async () => {
        "use server";
        await signIn("github");
      },
    },
    {
      id: "discord",
      name: "Discord",
      type: "oauth",
      signinUrl: "http://localhost:3000/api/auth/signin/discord",
      callbackUrl: "http://localhost:3000/api/auth/callback/discord",
      action: async () => {
        "use server";
        await signIn("discord");
      },
    },
    {
      id: "google",
      name: "Google",
      type: "oauth",
      signinUrl: "http://localhost:3000/api/auth/signin/google",
      callbackUrl: "http://localhost:3000/api/auth/callback/google",
      action: async () => {
        "use server";
        await signIn("google");
      },
    },
    //"credentials":{"id":"credentials","name":"Credentials","type":"credentials","signinUrl":"http://localhost:3000/api/auth/signin/credentials","callbackUrl":"http://localhost:3000/api/auth/callback/credentials"}
  ];
  return <LoginOptions providers={providers} signin_action={signin_action} />;
}
