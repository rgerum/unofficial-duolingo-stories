# Convex + Better Auth: cost and session best practices

Research date: 2026-08-24. Sources are limited to official Convex and Better Auth documentation and the official `get-convex/better-auth` repository.

## Executive conclusion

The integration is broadly configured in the documented way, but three opportunities stand out:

1. Enable a short Better Auth session cookie cache to avoid repeated database-backed session reads. Better Auth documents this specifically for avoiding a database call on every `useSession`/`getSession` request. A 60–300 second cache is the lowest-risk starting point, with the explicit tradeoff that remote revocation or changed session data may take that long to take effect. ([Better Auth session management](https://better-auth.com/docs/concepts/session-management))
2. Use Convex auth state/claims where live Better Auth session validation is unnecessary. Convex recommends `useConvexAuth()` (or its auth-state components) for UI auth state and distinguishes `ctx.auth.getUserIdentity()`—which uses the already validated JWT—from `authComponent.getAuthUser(ctx)`, which validates the backing Better Auth session. ([Convex + Better Auth authorization](https://labs.convex.dev/better-auth/basic-usage/authorization))
3. Investigate upstream issue #408 before treating the frequent logout as a configured expiry problem. It reports that `@convex-dev/better-auth` 0.12.5 can treat a transient `/get-session` or `/convex/token` failure as sign-out. This project uses that exact integration version (`^0.12.5`), and the locally installed provider source has the described error-insensitive clearing behavior. The issue remains an upstream report, not a confirmed diagnosis for this deployment. ([official repository issue #408](https://github.com/get-convex/better-auth/issues/408))

## What the official guidance says

### Session lifetime and caching

Better Auth's database-backed session defaults are seven days for `expiresIn` and one day for `updateAge`; use after `updateAge` extends the expiry. The current project does not override these defaults. A refresh token is therefore not the missing mechanism for the main login session. ([Better Auth session management](https://better-auth.com/docs/concepts/session-management), [options reference](https://better-auth.com/docs/reference/options))

`session.cookieCache` is disabled by default. When enabled, Better Auth stores short-lived signed session data in a cookie and can answer session checks without reading the database until `maxAge` elapses. The official example uses five minutes. Revoked sessions on other devices can remain accepted until cache expiry, so sensitive operations can bypass the cache and deployments needing faster revocation should choose a shorter lifetime. ([Better Auth session management](https://better-auth.com/docs/concepts/session-management))

The Better Auth client does not poll by default (`refetchInterval: 0`), but it does refetch on window focus by default. Disabling focus refetch may reduce outer HTTP calls but changes freshness behavior and should follow route-level measurement rather than be the first change. ([Better Auth client](https://better-auth.com/docs/concepts/client))

### Convex JWT behavior

The Convex plugin's access JWT defaults to 15 minutes. Convex's React client automatically asks its configured token fetcher for a replacement when a token expires, so a short access-token lifetime is normal. The documented performance mechanism is reuse/caching, not increasing the JWT lifetime. ([Convex plugin API](https://labs.convex.dev/better-auth/api/convex-plugin), [Convex React client API](https://docs.convex.dev/api/classes/react.ConvexReactClient))

The integration offers server-side JWT cookie caching for Next.js helpers, allowing authenticated SSR queries to reuse an unexpired token instead of requesting `/convex/token` on each server-rendered navigation. It requires an `isAuthError` classifier so an auth rejection can retry with a fresh token. This feature is explicitly labelled experimental; the project does not currently enable it. ([Convex + Better Auth experimental features](https://labs.convex.dev/better-auth/experimental))

The same experimental page documents static JWKS as a latency optimization for token validation. It avoids OIDC/JWKS HTTP lookups, but it is not presented as a way to reduce application function-call counts in the dashboard. ([Convex + Better Auth experimental features](https://labs.convex.dev/better-auth/experimental))

### Avoiding unnecessary session validation

Convex recommends `useConvexAuth()` rather than Better Auth's `useSession()` when the UI only needs to know whether Convex has authenticated the user. In Convex functions, `ctx.auth.getUserIdentity()` reads claims from the JWT already validated by Convex, whereas `authComponent.getAuthUser(ctx)` validates the corresponding Better Auth session. The latter is appropriate when immediate session revocation or fresh database user/session data is required; the former avoids that component lookup when JWT-age freshness is acceptable. ([Convex + Better Auth authorization](https://labs.convex.dev/better-auth/basic-usage/authorization))

This project globally mounts `ConvexBetterAuthProvider`, whose implementation itself calls `authClient.useSession()`. Consequently, merely replacing additional `useSession()` consumers may not eliminate the one shared session request on page load. Meaningful outer HTTP-call reduction on anonymous public pages may require not mounting the authenticated provider for routes that truly do not use Convex auth, which is a larger behavioral change and should be measured and tested.

## Interpreting the Convex dashboard

Convex counts HTTP actions as function calls, so `/api/auth/*` legitimately appears in the function-call breakdown. Convex also describes client calls and reactive subscription updates as function executions. ([Convex usage limits](https://docs.convex.dev/production/usage-limits), [system limits](https://docs.convex.dev/production/state/limits))

The Better Auth adapter rows show that auth HTTP requests trigger component database operations. The dashboard demonstrates separate executions, but the official billing documentation located for this review does not explicitly establish that the HTTP row plus every nested component row should be added together as separately billed calls. Cost conclusions should therefore use Convex's usage totals or billing export rather than summing chart rows without confirmation.

## Recommended order

1. Break `/api/auth/*` traffic down by path (`get-session`, `convex/token`, callbacks) and correlate failures with upstream issue #408. This is behavior-preserving.
2. Enable `session.cookieCache` for 60–300 seconds. This most directly targets `adapter.findOne`/`findMany`, with a bounded revocation delay.
3. Audit `authComponent.getAuthUser` and direct adapter reads; use `ctx.auth.getUserIdentity()` only where live session validation and fresh user data are not required.
4. Consider experimental server JWT caching for authenticated SSR, with an auth-error retry test. Do not globally fetch an initial token for anonymous routes merely to enable the cache.
5. Treat disabling focus refetch, splitting the provider out of public routes, or extending token lifetimes as later changes because they alter freshness, application structure, or security behavior.
