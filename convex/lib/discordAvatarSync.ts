type DiscordAccountRecord = {
  accountId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiresAt?: number | Date | null;
  providerId?: string | null;
  scope?: string | null;
  userId?: string | null;
};

type DiscordTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type DiscordUserResponse = {
  id?: string;
  avatar?: string | null;
  discriminator?: string | null;
};

export type DiscordAvatarSyncResult =
  | {
      ok: true;
      imageUrl: string | null;
      accessToken: string | null;
      refreshToken: string | null;
      accessTokenExpiresAt: number | null;
      scope: string | null;
    }
  | {
      ok: false;
      reason: string;
    };

function getDiscordCredentials() {
  const clientId =
    process.env.DISCORD_CLIENT_ID ?? process.env.AUTH_DISCORD_CLIENT_ID ?? null;
  const clientSecret =
    process.env.DISCORD_CLIENT_SECRET ??
    process.env.AUTH_DISCORD_CLIENT_SECRET ??
    null;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

function getDiscordBotToken() {
  return (
    process.env.DISCORD_TOKEN ??
    process.env.DISCORD_BOT_TOKEN ??
    process.env.BOT_TOKEN ??
    null
  );
}

async function fetchDiscordUserWithOAuth(
  accessToken: string,
): Promise<DiscordUserResponse | null> {
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord user fetch failed: ${response.status} ${text}`);
  }

  return (await response.json()) as DiscordUserResponse;
}

async function fetchDiscordUserById(
  discordAccountId: string,
  botToken: string,
): Promise<DiscordUserResponse | null> {
  const response = await fetch(
    `https://discord.com/api/v10/users/${discordAccountId}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Discord bot user fetch failed: ${response.status} ${text}`,
    );
  }

  return (await response.json()) as DiscordUserResponse;
}

async function refreshDiscordAccessToken(refreshToken: string) {
  const credentials = getDiscordCredentials();
  if (!credentials) {
    throw new Error("Discord OAuth credentials are not configured");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });

  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord token refresh failed: ${response.status} ${text}`);
  }

  return (await response.json()) as DiscordTokenResponse;
}

function buildDiscordAvatarUrl(user: DiscordUserResponse) {
  if (!user.id) return null;
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }

  const parsedDiscriminator =
    typeof user.discriminator === "string"
      ? Number.parseInt(user.discriminator, 10)
      : Number.NaN;
  const defaultAvatarIndex =
    typeof user.discriminator === "string" &&
    user.discriminator.length > 0 &&
    user.discriminator !== "0" &&
    Number.isFinite(parsedDiscriminator)
      ? parsedDiscriminator % 5
      : Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
}

async function tryFetchDiscordUserWithBot(account: DiscordAccountRecord) {
  const botToken = getDiscordBotToken();
  if (!botToken || !account.accountId) {
    return null;
  }

  return await fetchDiscordUserById(account.accountId, botToken);
}

export async function syncDiscordAvatarFromAccount(
  account: DiscordAccountRecord,
): Promise<DiscordAvatarSyncResult> {
  if (account.providerId !== "discord") {
    return { ok: false, reason: "not_discord" };
  }

  let accessToken =
    typeof account.accessToken === "string" && account.accessToken.length > 0
      ? account.accessToken
      : null;
  let refreshToken =
    typeof account.refreshToken === "string" && account.refreshToken.length > 0
      ? account.refreshToken
      : null;
  let accessTokenExpiresAt =
    typeof account.accessTokenExpiresAt === "number"
      ? account.accessTokenExpiresAt
      : account.accessTokenExpiresAt instanceof Date
        ? account.accessTokenExpiresAt.getTime()
        : null;
  let scope =
    typeof account.scope === "string" && account.scope.length > 0
      ? account.scope
      : null;

  try {
    const botUser = await tryFetchDiscordUserWithBot(account);
    if (botUser) {
      return {
        ok: true,
        imageUrl: buildDiscordAvatarUrl(botUser),
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        scope,
      };
    }
  } catch {
    // Fall back to the user's OAuth session if bot lookup is unavailable.
  }

  if (!accessToken && !refreshToken) {
    return { ok: false, reason: "missing_tokens" };
  }

  let user =
    accessToken !== null ? await fetchDiscordUserWithOAuth(accessToken) : null;

  if (!user && refreshToken) {
    const refreshed = await refreshDiscordAccessToken(refreshToken);
    accessToken =
      typeof refreshed.access_token === "string" &&
      refreshed.access_token.length
        ? refreshed.access_token
        : null;
    refreshToken =
      typeof refreshed.refresh_token === "string" &&
      refreshed.refresh_token.length
        ? refreshed.refresh_token
        : refreshToken;
    accessTokenExpiresAt =
      typeof refreshed.expires_in === "number"
        ? Date.now() + refreshed.expires_in * 1000
        : accessTokenExpiresAt;
    scope =
      typeof refreshed.scope === "string" && refreshed.scope.length > 0
        ? refreshed.scope
        : scope;

    if (!accessToken) {
      return { ok: false, reason: "refresh_missing_access_token" };
    }

    user = await fetchDiscordUserWithOAuth(accessToken);
  }

  if (!user) {
    return { ok: false, reason: "unable_to_fetch_profile" };
  }

  return {
    ok: true,
    imageUrl: buildDiscordAvatarUrl(user),
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    scope,
  };
}
