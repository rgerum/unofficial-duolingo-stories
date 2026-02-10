import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";

export const onCreate = internalMutation({
  args: {
    model: v.string(),
    doc: v.any(),
  },
  handler: async (ctx, args) => {
    if (args.model !== "user") return;
    const doc = args.doc as { _id: string; userId?: string | null };
    if (doc.userId) return;

    let maxId = 0;
    let cursor: string | null = null;
    do {
      const page = (await ctx.runQuery(
        components.betterAuth.adapter.findMany as any,
        {
        model: "user",
        where: [],
        paginationOpts: { cursor, numItems: 1000 },
        },
      )) as any;

      for (const user of page.page as Array<{ userId?: string | null }>) {
        const parsed = Number.parseInt(user.userId ?? "", 10);
        if (!Number.isNaN(parsed) && parsed > maxId) maxId = parsed;
      }

      cursor = page.isDone ? null : page.continueCursor ?? null;
    } while (cursor);

    const nextId = maxId + 1;
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: doc._id }],
        update: { userId: String(nextId) },
      },
    });
  },
});
