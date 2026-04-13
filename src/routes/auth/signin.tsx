import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import AuthLayout from "@/app/auth/layout";
import {
  LoginOptions,
  type ProviderProps,
} from "@/app/auth/signin/login_options";
import { isAuthenticated } from "@/lib/auth-server";

const getEnv = (...keys: string[]) =>
  keys.map((key) => process.env[key]).find((value) => value);

const hasProvider = (idKeys: string[], secretKeys: string[]) =>
  Boolean(getEnv(...idKeys) && getEnv(...secretKeys));

const getSigninData = createServerFn({ method: "GET" }).handler(async () => {
  const authenticated = await isAuthenticated();
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
      [
        "DISCORD_CLIENT_SECRET",
        "AUTH_DISCORD_SECRET",
        "AUTH_DISCORD_CLIENT_SECRET",
      ],
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

  return { authenticated, providers };
});

export const Route = createFileRoute("/auth/signin")({
  loader: async ({ location }) => {
    const data = await getSigninData();
    const callbackUrl =
      new URLSearchParams(location.search).get("callbackUrl") ?? "/";

    if (data.authenticated) {
      throw redirect({ to: "/" });
    }

    return {
      callbackUrl,
      providers: data.providers,
    };
  },
  component: SignInRoute,
});

function SignInRoute() {
  const { callbackUrl, providers } = Route.useLoaderData();

  return (
    <AuthLayout>
      <LoginOptions providers={providers} callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}
