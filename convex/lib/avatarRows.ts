import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

type LanguageDoc = Doc<"languages">;
type AvatarDoc = Doc<"avatars">;
type AvatarMappingDoc = Doc<"avatar_mappings">;

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

  return avatarRows
    .filter((avatar: AvatarDoc) => avatar.link !== "[object Object]")
    .map((avatar: AvatarDoc) => {
      const mapping = mappingByAvatar.get(avatar._id);
      return {
        id: mapping?.legacyId ?? null,
        avatar_id: avatar.legacyId,
        language_id: language.legacyId,
        name: mapping?.name ?? avatar.name ?? "",
        link: avatar.link,
        speaker: mapping?.speaker ?? "",
      };
    })
    .sort(
      (a: { avatar_id: number }, b: { avatar_id: number }) =>
        a.avatar_id - b.avatar_id,
    );
}
