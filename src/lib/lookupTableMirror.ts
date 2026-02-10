import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

type LanguageRow = {
  id?: number | null;
  name?: string | null;
  short?: string | null;
  flag?: number | null;
  flag_file?: string | null;
  speaker?: string | null;
  default_text?: string | null;
  tts_replace?: string | null;
  public?: boolean | null;
  rtl?: boolean | null;
};

const RETRY_DELAYS_MS = [150, 500, 1200] as const;

async function retryMirror<T>(fn: () => Promise<T>, operationKey: string) {
  let lastError: unknown;

  for (const delayMs of RETRY_DELAYS_MS) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  try {
    return await fn();
  } catch (error) {
    lastError = error;
  }

  console.error("[mirror.lookup.failed]", {
    operationKey,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  return null;
}

export async function mirrorLanguage(row: LanguageRow, operationKey: string) {
  if (
    typeof row.id !== "number" ||
    typeof row.name !== "string" ||
    typeof row.short !== "string"
  ) {
    console.error("[mirror.lookup.skip.invalid_language_row]", {
      operationKey,
      row,
    });
    return null;
  }

  return retryMirror(
    () =>
      fetchAuthMutation((api as any).lookupTables.upsertLanguage, {
        language: {
          legacyId: row.id,
          name: row.name,
          short: row.short,
          flag: row.flag ?? null,
          flag_file: row.flag_file ?? null,
          speaker: row.speaker ?? null,
          default_text: row.default_text ?? null,
          tts_replace: row.tts_replace ?? null,
          public: Boolean(row.public),
          rtl: Boolean(row.rtl),
        },
        operationKey,
      }),
    operationKey,
  );
}
