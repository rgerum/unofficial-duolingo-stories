"use server";

type DiscordUserResponse = {
  id?: string;
  avatar?: string | null;
  discriminator?: string | null;
};

function getDiscordBotToken() {
  return (
    process.env.DISCORD_TOKEN ??
    process.env.DISCORD_BOT_TOKEN ??
    process.env.BOT_TOKEN ??
    null
  );
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

export async function resolveDiscordAvatarUrl(
  discordAccountId: string | null | undefined,
) {
  if (!discordAccountId) return null;

  const botToken = getDiscordBotToken();
  if (!botToken) return null;

  const response = await fetch(
    `https://discord.com/api/v10/users/${discordAccountId}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as DiscordUserResponse;
  return buildDiscordAvatarUrl(user);
}
