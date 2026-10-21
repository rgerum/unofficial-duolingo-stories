import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

type LanguageDoc = Doc<"languages">;
type AvatarDoc = Doc<"avatars">;
type AvatarMappingDoc = Doc<"avatar_mappings">;

const MAX_STORY_NAME_SUGGESTIONS = 4;
const SUGGESTION_LANGUAGE_SHORT = "es";

export async function buildAvatarRows(
  ctx: QueryCtx,
  language: LanguageDoc,
  avatars?: AvatarDoc[],
  mappings?: AvatarMappingDoc[],
) {
  const avatarRows = avatars ?? (await ctx.db.query("avatars").collect());
  const mappingRows =
    mappings ??
    (await ctx.db
      .query("avatar_mappings")
      .withIndex("by_language_id", (q) => q.eq("languageId", language._id))
      .collect());

  const mappingByAvatar = new Map<Id<"avatars">, AvatarMappingDoc>();
  for (const mapping of mappingRows) {
    mappingByAvatar.set(mapping.avatarId, mapping);
  }

  // Per-story names as suggestions for unnamed avatars: this language's own
  // first, then the Spanish course, which holds the "official" character
  // names. Only these two languages are read - scanning every language's
  // mappings made each editor query (and each re-run after any avatar edit
  // anywhere) read the whole table.
  const suggestionSources = [mappingRows];
  if (language.short !== SUGGESTION_LANGUAGE_SHORT) {
    const spanish = await ctx.db
      .query("languages")
      .withIndex("by_short", (q) => q.eq("short", SUGGESTION_LANGUAGE_SHORT))
      // Language shorts aren't enforced unique; never fail the editor on it.
      .first();
    if (spanish) {
      suggestionSources.push(
        await ctx.db
          .query("avatar_mappings")
          .withIndex("by_language_id", (q) => q.eq("languageId", spanish._id))
          .collect(),
      );
    }
  }
  const storyNamesByAvatar = new Map<Id<"avatars">, string[]>();
  for (const mapping of suggestionSources.flat()) {
    if (!mapping.storyNames) continue;
    const seen = storyNamesByAvatar.get(mapping.avatarId) ?? [];
    for (const name of Object.values(mapping.storyNames)) {
      if (seen.length >= MAX_STORY_NAME_SUGGESTIONS) break;
      if (name && !seen.includes(name)) seen.push(name);
    }
    storyNamesByAvatar.set(mapping.avatarId, seen);
  }

  return avatarRows
    .filter((avatar: AvatarDoc) => avatar.link !== "[object Object]")
    .map((avatar: AvatarDoc) => {
      const mapping = mappingByAvatar.get(avatar._id);
      return {
        id: mapping?.legacyId ?? null,
        avatar_id: avatar.legacyId,
        language_id: language.legacyId,
        // Empty mapping names fall through to the canonical avatar name so a
        // mapping created only to hold storyNames doesn't blank the display.
        name: mapping?.name || avatar.name || "",
        // Unmerged variants so the language editor can distinguish "set for
        // this language" (value) from canonical/suggested names (placeholder).
        language_name: mapping?.name || null,
        canonical_name: avatar.name || null,
        story_name_suggestions: (
          storyNamesByAvatar.get(avatar._id) ?? []
        ).slice(0, MAX_STORY_NAME_SUGGESTIONS),
        storyNames: mapping?.storyNames ?? null,
        gender: avatar.gender ?? null,
        link: avatar.link,
        speaker: mapping?.speaker ?? "",
      };
    })
    .sort(
      (a: { avatar_id: number }, b: { avatar_id: number }) =>
        a.avatar_id - b.avatar_id,
    );
}
