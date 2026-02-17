"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function Page() {
  const [id, setId] = useState("");
  const router = useRouter();

  function go() {
    const nextId = id.trim();
    if (!nextId) return;
    router.push(`/admin/story/${nextId}`);
  }

  return (
    <div className="mx-auto my-6 mb-10 w-[min(860px,calc(100vw-32px))]">
      <div className="relative isolate mx-auto my-6 mb-9 box-border w-full rounded-[18px] border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-[18px] shadow-[0_18px_42px_color-mix(in_srgb,#000_14%,transparent)]">
        <div className="flex flex-wrap items-end justify-between gap-4 px-0.5 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="whitespace-nowrap font-bold" htmlFor="story-id">
              Story ID
            </label>
            <div className="w-full max-w-[320px] flex-[0_1_320px]">
              <Input
                id="story-id"
                value={id}
                inputMode="numeric"
                placeholder="e.g. 12345"
                onChange={(e) => setId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") go();
                }}
              />
            </div>
          </div>
          <Button onClick={go} disabled={!id.trim()}>
            Open Story
          </Button>
        </div>
      </div>
    </div>
  );
}
