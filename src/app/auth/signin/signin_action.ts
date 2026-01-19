"use server";
import { authClient } from "@/lib/authClient";
import { ProviderProps } from "@/app/auth/signin/page";
import { redirect } from "next/navigation";
import { CallbackRouteError } from "@auth/core/errors";
import { auth } from "@/auth";

export async function signin_action(
  state: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    if (`${formData.get("username")}`.indexOf("@") !== -1) {
      const session = await auth.api.signInEmail({
        body: {
          email: formData.get("username") as string,
          password: formData.get("password") as string,
        },
      });
      if (session) redirect("/");
      else return { error: "Sign in failed" };
    }
    const session = await auth.api.signInUsername({
      body: {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
      },
    });
    console.log("login", session);
    if (session) redirect("/");
    else return { error: "Sign in failed" };
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
}
