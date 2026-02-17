"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@/components/ui/shadcn";

export default function Admin2StorySearchPage() {
  const [id, setId] = useState("");
  const router = useRouter();

  function go() {
    const nextId = id.trim();
    if (!nextId) return;
    router.push(`/admin2/story/${nextId}`);
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-[280px] space-y-1.5">
            <Label>Story ID</Label>
            <Input
              placeholder="e.g. 83"
              value={id}
              inputMode="numeric"
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") go();
              }}
            />
          </div>
          <Button onClick={go} disabled={!id.trim()}>
            Open story
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
