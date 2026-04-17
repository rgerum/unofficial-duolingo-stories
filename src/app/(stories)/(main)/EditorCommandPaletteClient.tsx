"use client";

import EditorCommandPalette from "@/app/editor/_components/editor_command_palette";
import { authClient } from "@/lib/auth-client";

type SessionUser = {
  role?: string | null;
};

export default function EditorCommandPaletteClient() {
  const { data: session } = authClient.useSession();
  const sessionUser = (session?.user ?? null) as SessionUser | null;
  const role = sessionUser?.role ?? null;
  const showCommandPalette = role === "contributor" || role === "admin";

  if (!showCommandPalette) return null;

  return <EditorCommandPalette canAdmin={role === "admin"} />;
}
