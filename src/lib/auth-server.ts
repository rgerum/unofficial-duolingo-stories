import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

const authServer = convexBetterAuthReactStart({
  convexUrl: process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL ?? "",
  convexSiteUrl:
    process.env.CONVEX_SITE_URL ??
    process.env.VITE_CONVEX_SITE_URL ??
    process.env.VITE_SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.SITE_URL ??
    "",
});

export const { handler, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  authServer;

export async function isAuthenticated() {
  return Boolean(await authServer.getToken());
}
