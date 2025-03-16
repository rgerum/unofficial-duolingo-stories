import { SignIn } from "./login";
import { signIn } from "@/auth";

export default function Page() {
  const signin_action = async (formData: FormData) => {
    "use server";
    await signIn("credentials", formData);
  };
  return <SignIn signin_action={signin_action} />;
}
