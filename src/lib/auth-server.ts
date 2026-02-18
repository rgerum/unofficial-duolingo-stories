import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const { handler, isAuthenticated, fetchAuthQuery, fetchAuthMutation } =
  convexBetterAuthNextJs({
    convexUrl:
      process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "",
    convexSiteUrl:
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.SITE_URL ??
      "",
  });
