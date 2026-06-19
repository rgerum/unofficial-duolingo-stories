import { importPKCS8, SignJWT } from "jose";

export const socialProviderConfigs = {
  apple: {
    idKeys: ["APPLE_CLIENT_ID"],
    secretKeys: ["APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"],
  },
  github: {
    idKeys: ["GITHUB_CLIENT_ID", "GITHUB_ID", "AUTH_GITHUB_ID"],
    secretKeys: ["GITHUB_CLIENT_SECRET", "GITHUB_SECRET", "AUTH_GITHUB_SECRET"],
  },
  discord: {
    idKeys: ["DISCORD_CLIENT_ID", "AUTH_DISCORD_CLIENT_ID"],
    secretKeys: ["DISCORD_CLIENT_SECRET", "AUTH_DISCORD_CLIENT_SECRET"],
  },
  google: {
    idKeys: ["GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID"],
    secretKeys: ["GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET"],
  },
} as const;

export type SocialProviderId = keyof typeof socialProviderConfigs;

const getEnv = (...keys: readonly string[]) =>
  keys.map((key) => process.env[key]).find((value) => value);

function getApplePrivateKey() {
  return getEnv("APPLE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
}

async function generateAppleClientSecret() {
  const clientId = getEnv("APPLE_CLIENT_ID");
  const teamId = getEnv("APPLE_TEAM_ID");
  const keyId = getEnv("APPLE_KEY_ID");
  const privateKey = getApplePrivateKey();

  if (!clientId || !teamId || !keyId || !privateKey) {
    throw new Error("Missing Apple sign-in environment variables");
  }

  const key = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

const getAppleSocialProvider = () => {
  const clientId = getEnv("APPLE_CLIENT_ID");
  const teamId = getEnv("APPLE_TEAM_ID");
  const keyId = getEnv("APPLE_KEY_ID");
  const privateKey = getApplePrivateKey();

  if (!clientId || !teamId || !keyId || !privateKey) return undefined;

  return async () => ({
    clientId,
    clientSecret: await generateAppleClientSecret(),
  });
};

export const getSocialProvider = (providerId: SocialProviderId) => {
  if (providerId === "apple") return getAppleSocialProvider();

  const config = socialProviderConfigs[providerId];
  const clientId = getEnv(...config.idKeys);
  const clientSecret = getEnv(...config.secretKeys);
  if (!clientId || !clientSecret) return undefined;
  return { clientId, clientSecret };
};

export const getEnabledSocialProviderIds = (): SocialProviderId[] =>
  Object.keys(socialProviderConfigs).filter((providerId) =>
    Boolean(getSocialProvider(providerId as SocialProviderId)),
  ) as SocialProviderId[];

export const getSocialProviders = () =>
  Object.fromEntries(
    getEnabledSocialProviderIds().map((providerId) => [
      providerId,
      getSocialProvider(providerId),
    ]),
  );
