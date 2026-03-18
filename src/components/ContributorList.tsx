"use client";

import React from "react";
import { IconDiscord } from "@/components/icons";

export type ContributorProfile = {
  legacyUserId: number;
  name: string;
  image: string | null;
  discordLinked: boolean;
};

type ContributorInput =
  | ContributorProfile
  | {
      legacyUserId?: number;
      name?: string | null;
      image?: string | null;
      discordLinked?: boolean | null;
    }
  | string;

function normalizeContributor(
  contributor: ContributorInput,
  index: number,
): ContributorProfile {
  if (typeof contributor === "string") {
    const name = contributor.trim();
    return {
      legacyUserId: -(index + 1),
      name: name || "Unknown",
      image: null,
      discordLinked: false,
    };
  }

  const name = contributor.name?.trim() || "Unknown";
  return {
    legacyUserId:
      typeof contributor.legacyUserId === "number"
        ? contributor.legacyUserId
        : -(index + 1),
    name,
    image:
      typeof contributor.image === "string" && contributor.image.length > 0
        ? contributor.image
        : null,
    discordLinked: contributor.discordLinked === true,
  };
}

function ContributorAvatar({
  contributor,
  size,
}: {
  contributor: ContributorProfile;
  size: "sm" | "md";
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const initial = contributor.name.trim().charAt(0).toUpperCase() || "?";
  const sizeClass =
    size === "sm" ? "h-8 w-8 text-[13px]" : "h-10 w-10 text-[15px]";
  const showImage = contributor.image && !imageFailed;
  const showDiscordFallback = !showImage && contributor.discordLinked;

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--profile-background)] font-bold text-[var(--profile-text)] ${sizeClass}`}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          alt=""
          src={contributor.image ?? undefined}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : showDiscordFallback ? (
        <span className="scale-[0.62] text-[var(--profile-text)]">
          <IconDiscord />
        </span>
      ) : (
        initial
      )}
    </div>
  );
}

export default function ContributorList({
  contributors,
  emptyLabel,
  size = "sm",
  muted = false,
}: {
  contributors: ContributorInput[];
  emptyLabel?: string;
  size?: "sm" | "md";
  muted?: boolean;
}) {
  if (contributors.length === 0) {
    return emptyLabel ? (
      <p className="text-[var(--text-color-dim)]">{emptyLabel}</p>
    ) : null;
  }

  const normalizedContributors = contributors.map((contributor, index) =>
    normalizeContributor(contributor, index),
  );

  return (
    <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
      {normalizedContributors.map((contributor, index) => (
        <li
          key={`${contributor.legacyUserId}-${contributor.name}-${index}`}
          className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 ${
            muted
              ? "border-[var(--overview-hr)] bg-[var(--body-background-faint)] text-[var(--text-color-dim)]"
              : "border-[var(--overview-hr)] bg-[var(--body-background)] text-[var(--text-color)]"
          }`}
          title={contributor.name}
        >
          <ContributorAvatar contributor={contributor} size={size} />
          <span className={size === "sm" ? "text-[14px]" : "text-[15px]"}>
            {contributor.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
