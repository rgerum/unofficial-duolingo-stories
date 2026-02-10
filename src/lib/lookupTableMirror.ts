import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

type LanguageRow = {
  id?: number;
  name?: string;
  short?: string;
  flag?: number | null;
  flag_file?: string | null;
  speaker?: string | null;
  default_text?: string | null;
  tts_replace?: string | null;
  public?: boolean;
  rtl?: boolean;
};

function optionalString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function optionalNumber(value: number | null | undefined): number | undefined {
  return value ?? undefined;
}

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

  throw new Error(`Convex mirror failed for ${operationKey}`);
}

export async function mirrorLanguage(row: LanguageRow, operationKey: string) {
  if (
    typeof row.id !== "number" ||
    typeof row.name !== "string" ||
    typeof row.short !== "string"
  ) {
    const details = {
      operationKey,
      row,
    };
    console.error("[mirror.lookup.skip.invalid_language_row]", details);
    throw new Error(
      `Convex mirror rejected invalid language row for ${operationKey}`,
    );
  }

  return retryMirror(
    () =>
      fetchAuthMutation((api as any).lookupTables.upsertLanguage, {
        language: {
          legacyId: row.id,
          name: row.name,
          short: row.short,
          flag: optionalNumber(row.flag),
          flag_file: optionalString(row.flag_file),
          speaker: optionalString(row.speaker),
          default_text: optionalString(row.default_text),
          tts_replace: optionalString(row.tts_replace),
          public: Boolean(row.public),
          rtl: Boolean(row.rtl),
        },
        operationKey,
      }),
    operationKey,
  );
}
