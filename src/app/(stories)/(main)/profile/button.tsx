"use client";
import { GetIcon } from "@/components/icons";
import React from "react";
import { authClient } from "@/lib/auth-client";

export default function ProviderButton({
  d,
  value,
}: {
  d: string;
  value: boolean;
}) {
  const [linkError, setLinkError] = React.useState<string | null>(null);

  const handleLink = async () => {
    setLinkError(null);
    const { data, error } = await authClient.linkSocial({
      provider: d,
      callbackURL: window.location.href,
    });

    if (error) {
      setLinkError(error.message || "Could not link account.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="ml-2.5 flex w-full items-center">
      <GetIcon name={d} />
      <div className="ml-1">
        {d}:{" "}
        {value ? (
          <span className="mx-1 rounded-[10px] bg-[var(--header-border)] px-[10px] py-[5px]">
            Linked
          </span>
        ) : (
          <button
            type="button"
            className="mx-1 rounded-[10px] bg-[var(--button-blue-background)] px-[10px] py-[5px] text-[var(--button-blue-color)]"
            onClick={handleLink}
          >
            Link
          </button>
        )}
        {linkError ? (
          <span className="ml-2 text-[var(--error-red)]">{linkError}</span>
        ) : null}
      </div>
    </div>
  );
}
