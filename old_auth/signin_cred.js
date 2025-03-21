"use server";
import { signIn } from "@/auth";

export default async function signIn_cred(
  provider, //: string,
  args, //?: { username?: string; password?: string },
) {
  console.log("signIn cred", provider, args);
  if (args?.name) args.username = args.name;
  return await signIn(provider, { ...args, redirectTo: "/" });
}
