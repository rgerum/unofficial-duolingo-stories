import React from "react";
import { redirect } from "next/navigation";
import { LoginOptions } from "./login_options";
import { CallbackRouteError } from "@auth/core/errors";
import { authClient } from "@/lib/authClient";

export interface ProviderProps {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
  action: () => void;
}

export default async function Page({}) {
  const { data: session } = await authClient.getSession();

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
      if (`${formData.get("username")}`.indexOf("@") !== -1) {
        const { data, error } = await authClient.signIn.email({
          email: formData.get("username") as string,
          password: formData.get("password") as string,
        });
        if (!error) redirect("/");
        else return { error: error.message ?? "unknown error" };
      }
      const { data, error } = await authClient.signIn.username({
        username: formData.get("username") as string,
        password: formData.get("password") as string,
      });
      if (!error) redirect("/");
      else return { error: error.message ?? "unknown error" };
    } catch (error) {
      if ((error as CallbackRouteError)["cause"]) {
        return {
          error:
            (error as CallbackRouteError)["cause"]?.err?.message ||
            "Sign in error.",
        };
      }
      if ((error as Error).message === "NEXT_REDIRECT") {
        redirect("/");
      }

      return { error: "Unknown error" };
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
        await authClient.signIn.social({ provider: "facebook" });
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
        await authClient.signIn.social({ provider: "github" });
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
        await authClient.signIn.social({ provider: "discord" });
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
        await authClient.signIn.social({ provider: "google" });
      },
    },
    //"credentials":{"id":"credentials","name":"Credentials","type":"credentials","signinUrl":"http://localhost:3000/api/auth/signin/credentials","callbackUrl":"http://localhost:3000/api/auth/callback/credentials"}
  ];
  return <LoginOptions providers={providers} signin_action={signin_action} />;
}
